import JSZip from "jszip";
import S3ServiceClient from '../aws/S3ServiceClient';
import DynamoClient from "../aws/DynamoClient";
import FolderAlreadyExist from "../errors/FolderAlreadyExist";
import FolderNotExist from "../errors/FolderNotExist";
import { BucketObject, BucketType } from "../types/s3";


const S3Service = {
  bucketObjects: async function(bucketName: string, bucketType: BucketType, userId: string) {
    const s3Client = new S3ServiceClient();
    const { Contents } = await s3Client.bucketObjects(bucketName);

    let objects: BucketObject[] | null = await bucketContentParse(Contents, bucketType, userId, true);

    let objectsTree = [{
      name: '/',
      url: '/',
      size: 0,
      isFolder: true,
      shadowFolder: true,
      owner: true,
      children: buildObjTree(objects ?? [])
    }];

    if (bucketType === BucketType.Storage) {
      const dynamoClient = new DynamoClient();
      const sharingFolders = await dynamoClient.getFoldersWithUser(userId);

      if (sharingFolders.length > 0) {
        for (let sharing of sharingFolders) {
          const { Contents } = await s3Client.folderObjects(sharing.ownerId + '-' + BucketType.Storage, sharing.folderUrl);

          if (Contents && Contents.length > 0 && (Contents[0].Key?.split('/')?.length ?? 0) > 2) {
            Contents.unshift(...generateParentDirectories(Contents[0]));
          }

          let objects: BucketObject[] | null = await bucketContentParse(Contents, bucketType, sharing.ownerId, false, sharing.ownerEmail + '/');
          if (!objects) {
            continue;
          }

          const tree = buildObjTree(objects);
          const folderOfOwner = objectsTree[0].children.find(obj => obj.name === sharing.ownerEmail);

          if (folderOfOwner) {
            folderOfOwner.children = mergeTree(folderOfOwner.children ?? [], tree);
          } else {
            objectsTree[0].children.push({
              name: sharing.ownerEmail,
              url: sharing.ownerEmail + '/',
              size: 0,
              isFolder: true,
              shadowFolder: true,
              owner: false,
              ownerId: sharing.ownerId,
              sharing: { shared: true },
              children: tree,
            });
          }
        }
      }
    }

    return objectsTree ?? [];
  },

  createFolder: async function(bucketName: string, objectKey: string) {
    const s3Client = new S3ServiceClient();
    const folderName = objectKey + '/';

    try {
      await s3Client.isObjectExist(bucketName, folderName);
    } catch (e) {
      await s3Client.putBucketObject(bucketName, folderName);
      return true;
    }
    throw new FolderAlreadyExist(folderName);
  },

  shareFolder: async function(ownerId: string, bucketName: string, objectKey: string, userIds: string[]) {
    const folderName = objectKey + '/';

    try {
      const s3Client = new S3ServiceClient();
      await s3Client.isObjectExist(bucketName, folderName);

    } catch (e) {
      throw new FolderNotExist(folderName);
    }

    const dynamoClient = new DynamoClient();
    const shared = await dynamoClient.share(ownerId, folderName, userIds);
    return shared;
  },

  getShareWithEmails: async function(ownerId: string, bucketName: string, objectKey: string) {
    const folderName = objectKey + '/';

    try {
      const s3Client = new S3ServiceClient();
      await s3Client.isObjectExist(bucketName, folderName);

    } catch (e) {
      throw new FolderNotExist(folderName);
    }

    const dynamoClient = new DynamoClient();
    return (await dynamoClient.getShareWith(ownerId, folderName))
      .map(shareWithUser => shareWithUser.userEmail);
  },

  createMultipartUpload: async function(bucketName: string, objectKey: string) {
    const s3Client = new S3ServiceClient();
    await s3Client.createMultipartUpload(bucketName, objectKey);
    return true;
  },

  uploadObjectPart: async function(bucketName: string, objectKey: string, part: any, partNumber: string) {
    const s3Client = new S3ServiceClient();
    const { ETag } = await s3Client.uploadPart(bucketName, objectKey, part, partNumber);
    return { PartNumber: partNumber, ETag: ETag };
  },

  completeMultipartUpload: async function(bucketName: string, objectKey: string, uploadedParts: any) {
    const s3Client = new S3ServiceClient();
    await s3Client.completeMultipartUpload(bucketName, objectKey, uploadedParts);
    return true;
  },

  downloadObject: async function(bucketName: string, objectKey: string, folder: boolean) {
    const s3Client = new S3ServiceClient();

    if (folder) {
      objectKey += '/';
      const { Contents } = await s3Client.folderObjects(bucketName, objectKey);

      if (Contents && Contents.length > 0) {
        const zip = new JSZip();
        const folderName = objectKey.slice(0, -1).split('/').pop();

        const objects: BucketObject[] | null = await bucketContentParse(Contents);
        let tree = buildObjTree(objects ?? []);
        const traverse = async (obj: BucketObject, zip: JSZip) => {
          if (obj.isFolder) {
            const folder = zip.folder(obj.name);
            for (const child of obj.children || []) {
              await traverse(child, folder as JSZip);
            }

          } else {
            const { Body } = await s3Client.getBucketObject(bucketName, obj.url);
            const byteArray = await Body?.transformToByteArray() as Uint8Array;
            zip.file(obj.name, byteArray);
          }
        };

        if (tree.length > 0) {
          await traverse(tree[0], zip);
        }

        return {
          name: folderName + '.zip',
          content: await zip.generateAsync({ type: 'nodebuffer' })
        };

      } else {
        throw new Error('Folder is empty');
      }

    } else {
      const { Body } = await s3Client.getBucketObject(bucketName, objectKey);
      const objectName = objectKey.split('/').pop();
      const byteArray = await Body?.transformToByteArray();

      return {
        name: objectName,
        content: new Buffer(byteArray as Uint8Array)
      };
    }
  },

  getImagePreview: async function(bucketName: string, objectKey: string) {
    const s3Client = new S3ServiceClient();
    const obj = await s3Client.getBucketObject(bucketName, objectKey);
    const objBase64 = await obj?.Body?.transformToString("base64");
    const contentType = obj?.ContentType ?? 'application/json';

    return { contentType, objBase64 }
  },

  getBucketObjDetails: async function(bucketName: string, objectKey: string) {
    const s3Client = new S3ServiceClient();
    const { AcceptRanges, LastModified, ContentLength, ContentType } = await s3Client.getBucketObject(bucketName, objectKey);
    return { AcceptRanges, LastModified, ContentLength, ContentType };
  },

  deleteBucketObject: async function(bucketName: string, objectKey: string, isFolder: any) {
    const s3Client = new S3ServiceClient();

    if (isFolder) {
      objectKey += '/';
      const { Contents } = await s3Client.folderObjects(bucketName, objectKey);

      if ((Contents?.length ?? 0) > 0) {
        await s3Client.deleteBucketObjects(bucketName, Contents?.map(item => item.Key) as string[]);
      }
    }

    await s3Client.deleteBucketObject(bucketName, objectKey);
    return true;
  },

  deleteBucketObjects: async function(bucketName: string, objectKeys: string[]) {
    const s3Client = new S3ServiceClient();
    const { Deleted } = await s3Client.deleteBucketObjects(bucketName, objectKeys);
    return { Deleted };
  },

  copyBucketObject: async function(bucketName: string, objectKey: string, copiedKey: string) {
    const s3Client = new S3ServiceClient();
    await s3Client.copyBucketObject(bucketName, objectKey, copiedKey);
    return true;
  },
};

async function bucketContentParse(Contents, bucketType: BucketType|null = null, ownerId: string|null = null, owner: boolean|null = null, ownerPrefix: string = '') {
  if (!Contents) {
    return Promise.resolve(null);
  }

  return Promise.all(
    Contents?.map(async obj => {
      let node = {
        name: obj.Key?.slice(-1) === '/' ? obj.Key.slice(0, -1) : obj.Key,
        url: ownerPrefix + obj.Key,
        owner: owner,
        ownerId: ownerId,
        size: obj.Size,
        lastModified: obj.LastModified,
        isFolder: (obj.Size === 0 && obj.Key?.slice(-1) === '/'),
      } as BucketObject;

      if (bucketType === BucketType.Storage && node.isFolder && ownerId !== null && owner !== null) {
        node.sharing = {
          shared: !owner,
        }
        if (owner) {
          const dynamoClient = new DynamoClient();
          const shareWith = await dynamoClient.getShareWith(ownerId, obj.Key);
          node.sharing.shareWith = shareWith;
          node.sharing.shared = shareWith.length > 0;
        }
      }

      return node;
    })
  );
}

function buildObjTree(objects: BucketObject[], sharedParent: boolean|null = null): BucketObject[] {
  for (let i = 0; i < objects.length; i++) {
    let obj = objects[i];

    if (obj.isFolder) {
      let subObjects: BucketObject[] = [];

      for (let j = i + 1; j < objects.length; j++) {
        const subObj = objects[j];

        if (subObj.name.split('/').slice(0, 1).join('/') === obj.name) {
          subObj.name = subObj.name.substring(subObj.name.indexOf('/') + 1);
          subObjects.push(subObj);
          objects.splice(j, 1);
          j--;

        } else {
          break;
        }
      }

      if (sharedParent && obj.sharing) {
        obj.sharing.shared = sharedParent;
      }

      obj.children = buildObjTree(subObjects, obj.sharing?.shared ?? null);
    }
  }
  return objects;
}

function generateParentDirectories(folder) {
  const keyParts = folder.Key.split('/');
  const parentDirectories: any[] = [];

  let currentKey = '';
  for (let i = 0; i < keyParts.length - 2; i++) {
      currentKey += keyParts[i] + '/';
      parentDirectories.push({
          Key: currentKey,
          LastModified: folder.LastModified,
          Size: folder.Size
      });
  }
  return parentDirectories;
}

function mergeTree(tree1: BucketObject[], tree2: BucketObject[]): BucketObject[] {
  const mergedMap: Map<string, BucketObject> = new Map();

  function mergeObjects(obj1: BucketObject, obj2: BucketObject): BucketObject {
      if (obj1.name !== obj2.name || obj1.url !== obj2.url || obj1.isFolder !== obj2.isFolder) {
          throw new Error("Mismatched objects cannot be merged.");
      }

      const mergedObject: BucketObject = { ...obj1 };

      if (obj1.children && obj2.children) {
          mergedObject.children = mergeTree(obj1.children, obj2.children);
      } else if (obj2.children) {
          mergedObject.children = obj2.children;
      }

      return mergedObject;
  }

  for (const obj of [...tree1, ...tree2]) {
      if (!mergedMap.has(obj.name)) {
          mergedMap.set(obj.name, { ...obj });
      } else {
          mergedMap.set(obj.name, mergeObjects(mergedMap.get(obj.name)!, obj));
      }
  }

  return Array.from(mergedMap.values());
}

export default S3Service;