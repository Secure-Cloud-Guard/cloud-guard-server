import {
  S3Client,
  HeadBucketCommand, CreateBucketCommand,
  ListObjectsCommand, DeleteObjectsCommand,
  GetObjectCommand, HeadObjectCommand, PutObjectCommand, DeleteObjectCommand,
  ListMultipartUploadsCommand, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand
} from "@aws-sdk/client-s3";
import dotenv from 'dotenv';
import { CryptoService } from "../services/crypto.service";

dotenv.config();

class S3ServiceClient {
  private client: S3Client;
  private cryptoService: CryptoService;

  constructor(sseKey: string) {
    this.client = new S3Client({
      region: process.env.S3_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
      },
    });
    this.cryptoService = new CryptoService(sseKey);
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
    const { Contents } = await this.client.send(new ListObjectsCommand({
      Bucket: name
    }));

    Contents?.forEach(obj => obj.Key = this.cryptoService.decryptUrl(obj.Key as string));
    return { Contents };
  }

  async folderObjects(bucketName: string, folderKey: string) {
    const { Contents } = await this.client.send(new ListObjectsCommand({
      Bucket: bucketName,
      Prefix: this.cryptoService.encryptUrl(folderKey),
    }));

    Contents?.forEach(obj => obj.Key = this.cryptoService.decryptUrl(obj.Key as string));
    return { Contents };
  }

  async getBucketObject(bucketName: string, objectKey: string) {
    return await this.client.send(new GetObjectCommand({
      Bucket: bucketName,
      Key: this.cryptoService.encryptUrl(objectKey)
    }));
  }

  async isObjectExist(bucketName: string, objectKey: string) {
    return await this.client.send(new HeadObjectCommand({
      Bucket: bucketName,
      Key: this.cryptoService.encryptUrl(objectKey)
    }));
  }

  async putBucketObject(bucketName: string, objectKey: string) {
    return await this.client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: this.cryptoService.encryptUrl(objectKey)
    }));
  }

  async createMultipartUpload(bucketName: string, objectKey: string) {
    return await this.client.send(new CreateMultipartUploadCommand({
      Bucket: bucketName,
      Key: this.cryptoService.encryptUrl(objectKey),
    }));
  }

  async uploadPart(bucketName: string, objectKey: string, part, partNumber: string) {
    objectKey = this.cryptoService.encryptUrl(objectKey);

    return await this.client.send(new UploadPartCommand({
      Bucket: bucketName,
      Key: objectKey,
      Body: this.cryptoService.encryptBuffer(part),
      PartNumber: parseInt(partNumber),
      UploadId: await this.getUploadId(bucketName, objectKey),
    }));
  }

  async completeMultipartUpload(bucketName: string, objectKey: string, uploadedParts: []) {
    objectKey = this.cryptoService.encryptUrl(objectKey);

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
    objectKey = this.cryptoService.encryptUrl(objectKey);

    return await this.client.send(new AbortMultipartUploadCommand({
      Bucket: bucketName,
      Key: objectKey,
      UploadId: await this.getUploadId(bucketName, objectKey),
    }));
  }

  async deleteBucketObject(bucketName: string, objectKey: string) {
    return await this.client.send(new DeleteObjectCommand({
      Bucket: bucketName,
      Key: this.cryptoService.encryptUrl(objectKey)
    }));
  }

  async deleteBucketObjects(bucketName: string, objectKeys: string[]) {
    return await this.client.send(new DeleteObjectsCommand ({
      Bucket: bucketName,
      Delete: {
        Objects: objectKeys.map(key => ({ Key: this.cryptoService.encryptUrl(key) })),
        Quiet: false
      }
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