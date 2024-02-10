import { Request, Response, NextFunction } from "express";
import { ListObjectsCommand, CreateBucketCommand } from "@aws-sdk/client-s3";
import { StatusCodes } from 'http-status-codes';
import s3Client from '../aws/s3Client.ts';
import MissingParameter from "../errors/MissingParameter.ts";

const S3Service = {
  createBucket: async function(req: Request, res: Response, next: NextFunction) {
    try {
      const { name } = req.body;

      if (!name) {
        throw new MissingParameter('Bucket name is required');
      }

      const { Location } = await s3Client.send(new CreateBucketCommand({
        Bucket: name
      }));

      res
        .status(StatusCodes.CREATED)
        .json({ Location });

    } catch (error) {
      next(error);
    }
  },

  bucketObjects: async function(req: Request, res: Response, next: NextFunction) {
    try {
      const { name } = req.params;

      if (!name) {
        throw new MissingParameter('Bucket name is required');
      }

      const { Contents } = await s3Client.send(new ListObjectsCommand({ Bucket: name }));
      res.json(Contents);

    } catch (error) {
      next(error);
    }
  },
};

export default S3Service;