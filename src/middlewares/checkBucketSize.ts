import { NextFunction, Request, Response } from "express";
import S3ServiceClient from "../aws/S3ServiceClient";
import MaxSize from "../errors/MaxSize";
import { MAX_BUCKET_SIZE_MB } from "../const/s3";

export const checkBucketSize = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const s3Client = new S3ServiceClient(res.locals.sseKey);
    const { Contents } = await s3Client.bucketObjects(res.locals.bucketName);
    const bucketSize = Contents?.reduce((total, obj) => total + (obj?.Size ?? 0), 0);

    if ((bucketSize ?? 0) > MAX_BUCKET_SIZE_MB * 1024 * 1024) {
        throw new MaxSize(MAX_BUCKET_SIZE_MB, 'Bucket', '');
    }
    next();

  } catch (err: any) {
    next(err);
  }
}