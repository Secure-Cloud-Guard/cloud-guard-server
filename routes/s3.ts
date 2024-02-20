import { Router } from "express";
import S3Service from "../services/s3.ts";
import { Request, Response, NextFunction } from "express";

const S3Router = Router();

S3Router.route('/bucket')
  .post(S3Service.createBucket);

S3Router.route('/bucket/:bucketName/objects')
  .get(S3Service.bucketObjects)
  .delete(S3Service.deleteBucketObjects);

S3Router.route('/bucket/:bucketName/objects/:objectKey')
  .delete(S3Service.deleteBucketObject);

S3Router.get('/bucket/:bucketName/objects/:objectKey/details', S3Service.getBucketObjDetails);
S3Router.post('/bucket/:bucketName/objects/:objectKey/copy', S3Service.copyBucketObject);

S3Router.post('/robot/state', async function(req: Request, res: Response, next: NextFunction) {
  try {
    console.log('req.body: ', req.body);
    res.json(true);

  } catch (error) {
    next(error);
  }
});

export { S3Router };