import { NextFunction, Request, Response } from "express";
import cognitoClient from "../aws/cognitoProviderClient";
import MissingParameter from "../errors/MissingParameter";

export const setBucketName = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bucketType } = req.params;

    if (!bucketType) throw new MissingParameter('Bucket type is required');

    const { Username } = await cognitoClient.getUser(req.headers.authorization?.split(" ")[1] as string);

    res.locals.bucketName = Username + '-' + (bucketType === 'storage' ? 'storage' : 'personal-vault');
    next();

  } catch (err) {
    next(err);
  }
}