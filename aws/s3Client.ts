import { S3Client, CreateBucketCommand, ListObjectsCommand, GetObjectCommand, DeleteObjectCommand, DeleteObjectsCommand  } from "@aws-sdk/client-s3";
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
}

export default s3Client;