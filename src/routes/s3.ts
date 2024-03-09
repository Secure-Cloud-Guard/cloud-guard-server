import { Router } from "express";
import S3Controller from "../controllers/s3.controller";
import { setBucketName } from "../middlewares/setBucketName";
import { checkBucketExistence } from "../middlewares/checkBucketExistence";
import { setObjectKey } from "../middlewares/setObjectKey";
import { checkBucketSize } from "../middlewares/checkBucketSize";
import { uploadError } from "../middlewares/uploadError";

const S3Router = Router();

S3Router.use('/bucket/:bucketType/*', setBucketName, checkBucketExistence);

S3Router.route('/bucket/:bucketType/objects')
  .get(S3Controller.bucketObjects)
  .delete(S3Controller.deleteBucketObjects);

S3Router.route('/bucket/:bucketType/objects/:objectKey*')
  .get(setObjectKey, S3Controller.downloadObject)
  .put(checkBucketSize, setObjectKey, S3Controller.createMultipartUpload, uploadError)
  .patch(checkBucketSize, setObjectKey, S3Controller.uploadObjectPart, uploadError)
  .post(checkBucketSize, setObjectKey, S3Controller.completeMultipartUpload, uploadError)
  .delete(setObjectKey, S3Controller.deleteBucketObject);

S3Router.use('/bucket/:bucketType/objectService/:objectKey*/func*', setObjectKey);

S3Router.get('/bucket/:bucketType/objectService/:objectKey*/func/details', S3Controller.getBucketObjDetails);
S3Router.get('/bucket/:bucketType/objectService/:objectKey*/func/image', S3Controller.getImagePreview);
S3Router.post('/bucket/:bucketType/objectService/:objectKey*/func/copy', S3Controller.copyBucketObject);
S3Router.put('/bucket/:bucketType/objectService/:objectKey*/func/createFolder', S3Controller.createFolder);
S3Router.post('/bucket/:bucketType/objectService/:objectKey*/func/shareFolder', S3Controller.shareFolder);
S3Router.get('/bucket/:bucketType/objectService/:objectKey*/func/getShareWithEmails', S3Controller.getShareWithEmails);

export { S3Router };