import { S3Client, HeadBucketCommand, CreateBucketCommand, ListObjectsCommand, GetObjectCommand, ListMultipartUploadsCommand, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, DeleteObjectCommand, DeleteObjectsCommand, CopyObjectCommand } from "@aws-sdk/client-s3";
import dotenv from 'dotenv';

dotenv.config();

const client = new S3Client({
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});

const s3Client = {
  isBucketExist: async (name: string) => {
    return await client.send(new HeadBucketCommand({
      Bucket: name
    }));
  },

  createBucket: async (name: string) => {
    return await client.send(new CreateBucketCommand({
      Bucket: name
    }));
  },

  bucketObjects: async (name: string) => {
    return await client.send(new ListObjectsCommand({
      Bucket: name
    }));
  },

  getBucketObject: async (bucketName: string, objectKey: string) => {
    return await client.send(new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey
    }));
  },

  createMultipartUpload: async (bucketName: string, objectKey: string) => {
    return await client.send(new CreateMultipartUploadCommand({
      Bucket: bucketName,
      Key: objectKey,
    }));
  },

  uploadPart: async (bucketName: string, objectKey: string, part, partNumber: string) => {
    return await client.send(new UploadPartCommand({
      Bucket: bucketName,
      Key: objectKey,
      Body: part,
      PartNumber: parseInt(partNumber),
      UploadId: await getUploadId(bucketName, objectKey),
    }));
  },

  completeMultipartUpload:  async (bucketName: string, objectKey: string, uploadedParts: []) => {
    return await client.send(new CompleteMultipartUploadCommand({
      Bucket: bucketName,
      Key: objectKey,
      UploadId: await getUploadId(bucketName, objectKey),
      MultipartUpload: {
        Parts: uploadedParts
      }
    }));
  },

  deleteBucketObject: async (bucketName: string, objectKey: string) => {
    return await client.send(new DeleteObjectCommand({
      Bucket: bucketName,
      Key: objectKey
    }));
  },

  deleteBucketObjects: async (bucketName: string, objectKeys: string[]) => {
    return await client.send(new DeleteObjectsCommand ({
      Bucket: bucketName,
      Delete: {
        Objects: objectKeys.map(key => ({ Key: key })),
        Quiet: false
      }
    }));
  },

  copyBucketObject: async (bucketName: string, objectKey: string, copiedKey: string) => {
    return await client.send(new CopyObjectCommand({
      Bucket: bucketName,
      CopySource: bucketName + '/' + objectKey,
      Key: copiedKey
    }));
  },
}

async function getUploadId(bucketName: string, objectKey: string): Promise<string> {
  const { Uploads } = await client.send(new ListMultipartUploadsCommand({
    Bucket: bucketName
  }));

  let uploadId;
  const matchingUploads = Uploads?.filter(upload => upload.Key === objectKey);

  if (matchingUploads && matchingUploads.length > 0) {
    const latestUpload = matchingUploads.reduce((prev, current) => {
      if (prev.Initiated && current.Initiated) {
        return (prev.Initiated > current.Initiated) ? prev : current;
      } else if (!prev.Initiated && current.Initiated) {
        return current;
      } else {
        return prev;
      }
    }, matchingUploads[0]);
    uploadId = latestUpload.UploadId;
  }

  return uploadId;
}

export default s3Client;