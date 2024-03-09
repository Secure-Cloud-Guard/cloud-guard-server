import {
  S3Client,
  HeadBucketCommand, CreateBucketCommand,
  ListObjectsCommand, DeleteObjectsCommand,
  GetObjectCommand, HeadObjectCommand, PutObjectCommand, DeleteObjectCommand, CopyObjectCommand,
  ListMultipartUploadsCommand, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand
} from "@aws-sdk/client-s3";
import dotenv from 'dotenv';

dotenv.config();

class S3ServiceClient {
  private client: S3Client;

  constructor() {
    this.client = new S3Client({
      region: process.env.S3_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
      },
    });
  }

  async isBucketExist(name: string) {
    return await this.client.send(new HeadBucketCommand({
      Bucket: name
    }));
  }

  async createBucket(name: string) {
    return await this.client.send(new CreateBucketCommand({
      Bucket: name
    }));
  }

  async bucketObjects(name: string) {
    return await this.client.send(new ListObjectsCommand({
      Bucket: name
    }));
  }

  async folderObjects(bucketName: string, folderKey: string) {
    return await this.client.send(new ListObjectsCommand({
      Bucket: bucketName,
      Prefix: folderKey,
    }));
  }

  async getBucketObject(bucketName: string, objectKey: string) {
    return await this.client.send(new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey
    }));
  }

  async isObjectExist(bucketName: string, objectKey: string) {
    return await this.client.send(new HeadObjectCommand({
      Bucket: bucketName,
      Key: objectKey
    }));
  }

  async putBucketObject(bucketName: string, objectKey: string) {
    return await this.client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey
    }));
  }

  async createMultipartUpload(bucketName: string, objectKey: string) {
    return await this.client.send(new CreateMultipartUploadCommand({
      Bucket: bucketName,
      Key: objectKey,
    }));
  }

  async uploadPart(bucketName: string, objectKey: string, part, partNumber: string) {
    return await this.client.send(new UploadPartCommand({
      Bucket: bucketName,
      Key: objectKey,
      Body: part,
      PartNumber: parseInt(partNumber),
      UploadId: await this.getUploadId(bucketName, objectKey),
    }));
  }

  async completeMultipartUpload(bucketName: string, objectKey: string, uploadedParts: []) {
    return await this.client.send(new CompleteMultipartUploadCommand({
      Bucket: bucketName,
      Key: objectKey,
      UploadId: await this.getUploadId(bucketName, objectKey),
      MultipartUpload: {
        Parts: uploadedParts
      }
    }));
  }

  async abortMultipartUpload(bucketName: string, objectKey: string) {
    return await this.client.send(new AbortMultipartUploadCommand({
      Bucket: bucketName,
      Key: objectKey,
      UploadId: await this.getUploadId(bucketName, objectKey),
    }));
  }

  async deleteBucketObject(bucketName: string, objectKey: string) {
    return await this.client.send(new DeleteObjectCommand({
      Bucket: bucketName,
      Key: objectKey
    }));
  }

  async deleteBucketObjects(bucketName: string, objectKeys: string[]) {
    return await this.client.send(new DeleteObjectsCommand ({
      Bucket: bucketName,
      Delete: {
        Objects: objectKeys.map(key => ({ Key: key })),
        Quiet: false
      }
    }));
  }

  async copyBucketObject(bucketName: string, objectKey: string, copiedKey: string) {
    return await this.client.send(new CopyObjectCommand({
      Bucket: bucketName,
      CopySource: bucketName + '/' + objectKey,
      Key: copiedKey
    }));
  }

  private async getUploadId(bucketName: string, objectKey: string): Promise<string> {
    const { Uploads } = await this.client.send(new ListMultipartUploadsCommand({
      Bucket: bucketName
    }));

    let uploadId;
    const matchingUploads = Uploads?.filter(upload => upload.Key === objectKey);

    if (matchingUploads && matchingUploads.length > 0) {
      const latestUpload = matchingUploads.reduce((prev, current) => {
        if (prev.Initiated && current.Initiated) {
          return (prev.Initiated > current.Initiated) ? prev : current;
        } else if (!prev.Initiated && current.Initiated) {
          return current;
        } else {
          return prev;
        }
      }, matchingUploads[0]);
      uploadId = latestUpload.UploadId;
    }
    return uploadId;
  }

  private async abortAllUploads(bucketName: string) {
    const { Uploads } = await this.client.send(new ListMultipartUploadsCommand({
      Bucket: bucketName
    }));

    Uploads?.forEach(async (Upload) => {
      await this.client.send(new AbortMultipartUploadCommand({
        Bucket: bucketName,
        Key: Upload.Key,
        UploadId: Upload.UploadId,
      }));
    });
  }
}

export default S3ServiceClient;