import { NextFunction, Request, Response } from "express";
import CognitoClient from "../aws/CognitoClient";

export const setUserId = async (req: Request, res: Response, next: NextFunction) => {
  try {

    const cognitoClient = new CognitoClient();
    const { Username } = await cognitoClient.getCurrentUser(req.headers.authorization?.split(" ")[1] as string);

    res.locals.userId = Username;
    next();

  } catch (err) {
    next(err);
  }
}