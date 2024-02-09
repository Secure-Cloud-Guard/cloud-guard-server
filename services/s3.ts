import { Request, Response, NextFunction } from "express";
import { ListObjectsCommand, CreateBucketCommand } from "@aws-sdk/client-s3";
import { StatusCodes } from 'http-status-codes';
import s3Client from '../aws/s3Client.ts';

const S3Service = {
  createBucket: async function(req: Request, res: Response, next: NextFunction) {
    try {
    const { Location } = await s3Client.send(new CreateBucketCommand({
      Bucket: 'cloud-guard-user-' + 123
    }));

    console.log(`Bucket created with location ${Location}`);
    res
      .status(StatusCodes.CREATED)
      .json({ Location });

    } catch (error) {
      next(error);
    }
  },

  bucketObjects: async function(req: Request, res: Response, next: NextFunction) {
    try {
      const { Contents } = await s3Client.send(new ListObjectsCommand({ Bucket: 'cloud-guard-storage' }));
      res.json(Contents);

    } catch (error) {
      next(error);
    }
  },
};

export default S3Service;