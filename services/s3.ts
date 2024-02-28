import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import s3Client from '../aws/s3Client';
import MissingParameter from "../errors/MissingParameter";
import MaxSize from "../errors/MaxSize";
import { BucketObject } from "../types/s3";
import { MAX_OBJECT_SIZE_MB, OBJECT_PART_SIZE_MB } from "../const/s3";


const S3Service = {
  bucketObjects: async function(req: Request, res: Response, next: NextFunction) {
    try {
      const { Contents } = await s3Client.bucketObjects(res.locals.bucketName);

      let objects: BucketObject[] | undefined = Contents?.map(obj => ({
        name: obj.Key?.slice(-1) === '/' ? obj.Key.slice(0, -1) : obj.Key,
        url: obj.Key,
        size: obj.Size,
        lastModified: obj.LastModified,
        isFolder: (obj.Size === 0 && obj.Key?.slice(-1) === '/'),
      }) as BucketObject);

      let objectsTree = [{
        name: '/',
        url: '/',
        size: 0,
        isFolder: true,
        children: buildObjTree(objects ?? [])
      }];
      res.json(objectsTree ?? []);

    } catch (error) {
      next(error);
    }
  },

  createMultipartUpload: async function(req: Request, res: Response, next: NextFunction) {
    try {
      await s3Client.createMultipartUpload(res.locals.bucketName, res.locals.objectKey);
      res.json(true);

    } catch (error) {
      next(error);
    }
  },

  uploadObjectPart: async function(req: Request, res: Response, next: NextFunction) {
    try {
      const partNumber = req.headers['part-number'];

      if (!partNumber) throw new MissingParameter('Part number is required');

      // delete the unique identifier
      res.locals.objectKey = res.locals.objectKey.substring(6);

      let chunks: any = [];
      req.on('data', async (chunk) => {
        chunks.push(chunk);
      });

      req.on('end', async () => {
        const part = Buffer.concat(chunks);
        const { ETag } = await s3Client.uploadPart(res.locals.bucketName, res.locals.objectKey, part, partNumber as string);
        res.json({ PartNumber: partNumber, ETag: ETag });
      });

    } catch (error) {
      next(error);
    }
  },

  completeMultipartUpload: async function(req: Request, res: Response, next: NextFunction) {
    try {
      const { uploadedParts } = req.body;

      if (!uploadedParts) throw new MissingParameter('Uploaded parts is required');

      if (uploadedParts.length > MAX_OBJECT_SIZE_MB / OBJECT_PART_SIZE_MB) {
        throw new MaxSize(MAX_OBJECT_SIZE_MB, 'File', res.locals.objectKey);
      }

      await s3Client.completeMultipartUpload(res.locals.bucketName, res.locals.objectKey, uploadedParts);
      res.json(true);

    } catch (error) {
      next(error);
    }
  },

  getImagePreview: async function(req: Request, res: Response, next: NextFunction) {
    try {
      const obj = await s3Client.getBucketObject(res.locals.bucketName, res.locals.objectKey);
      const objBase64 = await obj?.Body?.transformToString("base64");
      const contentType = obj?.ContentType ?? 'application/json';

      res
        .status(StatusCodes.OK)
        .contentType(contentType)
        .setHeader('isBase64Encoded', 'true')
        .json(objBase64);

    } catch (error) {
      next(error);
    }
  },

  getBucketObjDetails: async function(req: Request, res: Response, next: NextFunction) {
    try {
      const { AcceptRanges, LastModified, ContentLength, ContentType } = await s3Client.getBucketObject(res.locals.bucketName, res.locals.objectKey);
      res.json({ AcceptRanges, LastModified, ContentLength, ContentType });

    } catch (error) {
      next(error);
    }
  },

  deleteBucketObject: async function(req: Request, res: Response, next: NextFunction) {
    try {
      await s3Client.deleteBucketObject(res.locals.bucketName, res.locals.objectKey);
      res.json(true);

    } catch (error) {
      next(error);
    }
  },

  deleteBucketObjects: async function(req: Request, res: Response, next: NextFunction) {
    try {
      const { objectKeys } = req.body;

      if (!objectKeys) throw new MissingParameter('Object keys is required');

      const { Deleted } = await s3Client.deleteBucketObjects(res.locals.bucketName, objectKeys);
      res.json({ Deleted });

    } catch (error) {
      next(error);
    }
  },

  copyBucketObject: async function(req: Request, res: Response, next: NextFunction) {
    try {
      const { copiedKey } = req.body;

      if (!copiedKey) throw new MissingParameter('Copied object key is required');

      await s3Client.copyBucketObject(res.locals.bucketName, res.locals.objectKey, copiedKey);
      res.json(true);

    } catch (error) {
      next(error);
    }
  },
};

function buildObjTree(objects: BucketObject[]): BucketObject[] {
  for (let i = 0; i < objects.length; i++) {
    const obj = objects[i];

    if (obj.isFolder) {
      let subObjects: BucketObject[] = [];

      for (let j = i + 1; j < objects.length; j++) {
        const subObj = objects[j];
        if (subObj.name.split('/')[0] === obj.name) {
          subObj.name = subObj.name.substring(subObj.name.indexOf('/') + 1);
          subObjects.push(subObj);
          objects.splice(j, 1);
          j--;
        } else {
          break;
        }
      }
      obj.children = buildObjTree(subObjects);
    }
  }
  return objects;
}

export default S3Service;