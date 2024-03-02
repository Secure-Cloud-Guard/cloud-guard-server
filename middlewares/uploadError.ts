import { Request, Response, NextFunction } from "express";
import s3Client from '../aws/s3Client';

export async function uploadError(err: Error, req: Request, res: Response, next: NextFunction) {
  try {
    await s3Client.abortMultipartUpload(res.locals.bucketName, res.locals.objectKey);
    next(err);

  } catch (abortError) {
    next(abortError);
  }
}