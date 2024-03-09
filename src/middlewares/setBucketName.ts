import { NextFunction, Request, Response } from "express";
import CognitoClient from "../aws/CognitoClient";
import MissingParameter from "../errors/MissingParameter";
import { BucketType } from "../types/s3";

export const setBucketName = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bucketType } = req.params;

    if (!bucketType) throw new MissingParameter('Bucket type is required');

    res.locals.bucketName = res.locals.userId + '-' + (bucketType === BucketType.Storage ? BucketType.Storage : BucketType.PersonalVault);
    next();

  } catch (err) {
    next(err);
  }
}