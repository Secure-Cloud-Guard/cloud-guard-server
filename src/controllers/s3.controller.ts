import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import S3Service from "../services/s3.service";
import CognitoService from "../services/cognito.service";
import MissingParameter from "../errors/MissingParameter";
import MaxSize from "../errors/MaxSize";
import ShareWithYourself from "../errors/ShareWithYourself";
import { MAX_OBJECT_SIZE_MB, OBJECT_PART_SIZE_MB } from "../const/s3";
import { BucketType } from "../types/s3";
import vaultClient from '../vault/VaultClient';
import DynamoClient from "../aws/DynamoClient";


const S3Controller = {
  bucketObjects: async function(req: Request, res: Response, next: NextFunction) {
    try {
      const { bucketType } = req.params;
      const objects = await S3Service.bucketObjects(res.locals.bucketName, bucketType as BucketType, res.locals.userId, res.locals.sseKey)
      res.json(objects);

    } catch (error) {
      next(error);
    }
  },

  createFolder: async function(req: Request, res: Response, next: NextFunction) {
    try {
      const created = await S3Service.createFolder(res.locals.bucketName, res.locals.objectKey, res.locals.sseKey);
      res.json(created);

    } catch (error) {
      next(error);
    }
  },

  shareFolder: async function(req: Request, res: Response, next: NextFunction) {
    try {
      const { userEmails } = req.body;

      if (!userEmails) throw new MissingParameter('User emails are required');

      let userIds: string[] = [];
      for (let email of userEmails) {
        const { Username } = await CognitoService.getUser(email);
        userIds.push(Username as string);
      }

      if (userIds.includes(res.locals.userId)) {
        throw new ShareWithYourself(res.locals.objectKey);
      }

      const shared = await S3Service.shareFolder(res.locals.userId, res.locals.bucketName, res.locals.objectKey, userIds, res.locals.sseKey);
      res.json(shared);

    } catch (error) {
      next(error);
    }
  },

  createMultipartUpload: async function(req: Request, res: Response, next: NextFunction) {
    try {
      const created = await S3Service.createMultipartUpload(res.locals.bucketName, res.locals.objectKey, res.locals.sseKey);
      res.json(created);

    } catch (error) {
      next(error);
    }
  },

  uploadObjectPart: async function(req: Request, res: Response, next: NextFunction) {
    try {
      const partNumber = req.headers['part-number'];

      if (!partNumber) throw new MissingParameter('Part number is required');

      // delete the unique identifier
      res.locals.objectKey = res.locals.objectKey.substring(6);

      let chunks: any = [];
      req.on('data', async (chunk) => {
        chunks.push(chunk);
      });

      req.on('end', async () => {
        const part = Buffer.concat(chunks);
        const uploadPart = await S3Service.uploadObjectPart(res.locals.bucketName, res.locals.objectKey, part, partNumber as string, res.locals.sseKey);
        res.json(uploadPart);
      });

    } catch (error) {
      next(error);
    }
  },

  completeMultipartUpload: async function(req: Request, res: Response, next: NextFunction) {
    try {
      const { uploadedParts } = req.body;

      if (!uploadedParts) throw new MissingParameter('Uploaded parts is required');

      if (uploadedParts.length > MAX_OBJECT_SIZE_MB / OBJECT_PART_SIZE_MB) {
        throw new MaxSize(MAX_OBJECT_SIZE_MB, 'File', res.locals.objectKey);
      }

      const completed = await S3Service.completeMultipartUpload(res.locals.bucketName, res.locals.objectKey, uploadedParts, res.locals.sseKey);
      res.json(completed);

    } catch (error) {
      next(error);
    }
  },

  downloadObject: async function(req: Request, res: Response, next: NextFunction) {
    try {
      const { bucketType } = req.params;
      const { owner, ownerid: ownerId, folder } = req.headers;

      if (!folder) throw new MissingParameter('Folder header is required');

      let bucketName = res.locals.bucketName;
      let objectKey = res.locals.objectKey;

      if (bucketType === BucketType.Storage && owner === 'false') {
        bucketName = ownerId + '-' + BucketType.Storage;
        objectKey = res.locals.objectKey.split('/').slice(1).join('/');
      }

      if (owner === 'false' && folder === 'true') {
        const dynamoClient = new DynamoClient();
        const shareWith = (await dynamoClient.getShareWith(ownerId as string, objectKey + '/')).map(share => share.userId);

        if (!shareWith.includes(res.locals.userId)) {
          throw new Error('You do not have access to this folder');
        }
      }

      const sseKey = owner === 'false' ? await vaultClient.getSSEkey(ownerId as string) : res.locals.sseKey;
      const { name, content } = await S3Service.downloadObject(bucketName, objectKey, folder === 'true', sseKey);
      res.attachment(name);
      res.send(content);

    } catch (error) {
      next(error);
    }
  },

  getImagePreview: async function(req: Request, res: Response, next: NextFunction) {
    try {
      const { bucketType } = req.params;
      const { owner, ownerid: ownerId } = req.headers;

      let bucketName = res.locals.bucketName;
      let objectKey = res.locals.objectKey;

      if (bucketType === BucketType.Storage && owner === 'false') {
        bucketName = ownerId + '-' + BucketType.Storage;
        objectKey = res.locals.objectKey.split('/').slice(1).join('/');
      }

      const sseKey = owner === 'false' ? await vaultClient.getSSEkey(ownerId as string) : res.locals.sseKey;
      const { contentType, objBase64 } = await S3Service.getImagePreview(bucketName, objectKey, sseKey);
      res
        .status(StatusCodes.OK)
        .contentType(contentType)
        .setHeader('isBase64Encoded', 'true')
        .json(objBase64);

    } catch (error) {
      next(error);
    }
  },

  deleteBucketObject: async function(req: Request, res: Response, next: NextFunction) {
    try {
      const { isFolder } = req.body;
      const deleted = await S3Service.deleteBucketObject(res.locals.bucketName, res.locals.objectKey, isFolder, res.locals.userId, res.locals.sseKey);
      res.json(deleted);

    } catch (error) {
      next(error);
    }
  },
};

export default S3Controller;