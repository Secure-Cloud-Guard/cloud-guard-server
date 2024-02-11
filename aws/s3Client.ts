import { S3Client, CreateBucketCommand, ListObjectsCommand } from "@aws-sdk/client-s3";
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
}

export default s3Client;