import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import s3Client from "../aws/s3Client";

export const checkBucketExistence = async (req: Request, res: Response, next: NextFunction) => {
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