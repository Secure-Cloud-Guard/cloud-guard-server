import { Router } from "express";
import S3Service from "../services/s3.ts";

const S3Router = Router();

S3Router.post('/bucket', S3Service.createBucket);
S3Router.get('/bucket/:name/objects', S3Service.bucketObjects);
S3Router.get('/bucket/:bucketName/:objectKey/details', S3Service.getBucketObjDetails);
S3Router.delete('/bucket/:bucketName/:objectKey/delete', S3Service.deleteBucketObject);
S3Router.delete('/bucket/:bucketName/deleteObjects', S3Service.deleteBucketObjects);

export { S3Router };