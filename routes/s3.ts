import { Router } from "express";
import S3Service from "../services/s3.ts";

const S3Router = Router();

S3Router.post('/bucket', S3Service.createBucket);
S3Router.get('/bucket/:name/objects', S3Service.bucketObjects);

export { S3Router };