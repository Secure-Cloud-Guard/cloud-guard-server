import { S3Client, S3ClientConfig } from "@aws-sdk/client-s3";
import dotenv from 'dotenv';

dotenv.config();

const s3Config: S3ClientConfig = {
  region: "eu-north-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
};

const s3Client = new S3Client(s3Config);

export default s3Client;