import { Router } from "express";
import S3Service from "../services/s3.ts";

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

export { S3Router };