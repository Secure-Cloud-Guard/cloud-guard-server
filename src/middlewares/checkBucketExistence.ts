import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import S3ServiceClient from "../aws/S3ServiceClient";

export const checkBucketExistence = async (req: Request, res: Response, next: NextFunction) => {
  const s3Client = new S3ServiceClient();
  try {
    await s3Client.isBucketExist(res.locals.bucketName);
    next();

  } catch (err: any) {
    if (err?.$metadata?.httpStatusCode === StatusCodes.NOT_FOUND) {
      try {
        await s3Client.createBucket(res.locals.bucketName);
        next();
      } catch (createErr) {
        next(createErr);
      }
    } else {
      next(err);
    }
  }
}