import { Router } from "express";
import S3Service from "../services/s3";
import { setBucketName } from "../middlewares/setBucketName";
import { checkBucketExistence } from "../middlewares/checkBucketExistence";
import { setObjectKey } from "../middlewares/setObjectKey";
import { checkBucketSize } from "../middlewares/checkBucketSize";

const S3Router = Router();

S3Router.use('/bucket/:bucketType/*', setBucketName, checkBucketExistence);

S3Router.route('/bucket/:bucketType/objects')
  .get(S3Service.bucketObjects)
  .delete(S3Service.deleteBucketObjects);

S3Router.route('/bucket/:bucketType/objects/:objectKey*')
  .put(checkBucketSize, setObjectKey, S3Service.createMultipartUpload)
  .patch(checkBucketSize, setObjectKey, S3Service.uploadObjectPart)
  .post(checkBucketSize, setObjectKey, S3Service.completeMultipartUpload)
  .delete(setObjectKey, S3Service.deleteBucketObject);

S3Router.get('/bucket/:bucketType/objects/:objectKey*/details', setObjectKey, S3Service.getBucketObjDetails);
S3Router.get('/bucket/:bucketType/objects/:objectKey*/image', setObjectKey, S3Service.getImagePreview);
S3Router.post('/bucket/:bucketType/objects/:objectKey*/copy', setObjectKey, S3Service.copyBucketObject);

export { S3Router };