import { Request, Response, NextFunction } from "express";
import { StatusCodes } from 'http-status-codes';
import s3Client from '../aws/s3Client';
import MissingParameter from "../errors/MissingParameter";

const S3Service = {
  createBucket: async function(req: Request, res: Response, next: NextFunction) {
    try {
      const { bucketName } = req.body;

      if (!bucketName) throw new MissingParameter('Bucket name is required');

      const { Location } = await s3Client.createBucket(bucketName);

      res
        .status(StatusCodes.CREATED)
        .json({ Location });

    } catch (error) {
      next(error);
    }
  },

  bucketObjects: async function(req: Request, res: Response, next: NextFunction) {
    try {
      const { bucketName } = req.params;

      if (!bucketName) throw new MissingParameter('Bucket name is required');

      const { Contents } = await s3Client.bucketObjects(bucketName);
      res.json(Contents);

    } catch (error) {
      next(error);
    }
  },

  getBucketObjDetails: async function(req: Request, res: Response, next: NextFunction) {
    try {
      const { bucketName, objectKey } = req.params;

      if (!bucketName) throw new MissingParameter('Bucket name is required');
      if (!objectKey) throw new MissingParameter('Object key is required');

      const { AcceptRanges, LastModified, ContentLength, ContentType } = await s3Client.getBucketObject(bucketName, objectKey);
      res.json({ AcceptRanges, LastModified, ContentLength, ContentType });

    } catch (error) {
      next(error);
    }
  },

  deleteBucketObject: async function(req: Request, res: Response, next: NextFunction) {
    try {
      const { bucketName, objectKey } = req.params;

      if (!bucketName) throw new MissingParameter('Bucket name is required');
      if (!objectKey) throw new MissingParameter('Object key is required');

      await s3Client.deleteBucketObject(bucketName, objectKey);
      res.json(true);

    } catch (error) {
      next(error);
    }
  },

  deleteBucketObjects: async function(req: Request, res: Response, next: NextFunction) {
    try {
      const { bucketName } = req.params;
      const { objectKeys } = req.body;

      if (!bucketName) throw new MissingParameter('Bucket name is required');
      if (!objectKeys) throw new MissingParameter('Object keys is required');

      const { Deleted } = await s3Client.deleteBucketObjects(bucketName, objectKeys);
      res.json({ Deleted });

    } catch (error) {
      next(error);
    }
  },

  copyBucketObject: async function(req: Request, res: Response, next: NextFunction) {
    try {
      const { bucketName, objectKey } = req.params;
      const { copiedKey } = req.body;
      let { destinationBucket } = req.body;

      if (!bucketName) throw new MissingParameter('Bucket name is required');
      if (!objectKey) throw new MissingParameter('Object key is required');
      if (!copiedKey) throw new MissingParameter('Copied object key is required');

      if (!destinationBucket) {
        destinationBucket = bucketName;
      }

      await s3Client.copyBucketObject(bucketName, objectKey, destinationBucket, copiedKey);
      res.json(true);

    } catch (error) {
      next(error);
    }
  },
};

export default S3Service;