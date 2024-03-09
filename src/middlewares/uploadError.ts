import { Request, Response, NextFunction } from "express";
import S3ServiceClient from '../aws/S3ServiceClient';

export async function uploadError(err: Error, req: Request, res: Response, next: NextFunction) {
  try {
    const s3Client = new S3ServiceClient();
    await s3Client.abortMultipartUpload(res.locals.bucketName, res.locals.objectKey);
    next(err);

  } catch (abortError) {
    next(abortError);
  }
}