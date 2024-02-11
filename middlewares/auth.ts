import { NextFunction, Request, Response } from "express";
import CognitoExpress from "cognito-express";
import { StatusCodes } from 'http-status-codes';
import NoToken from "../errors/NoToken.ts";
import dotenv from 'dotenv';

dotenv.config();

const cognitoExpress = new CognitoExpress({
  region: process.env.COGNITO_REGION,
  cognitoUserPoolId: process.env.COGNITO_USER_POOL_ID,
  tokenUse: "access",
  tokenExpiration: 3600
});

export const validateAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.headers.authorization || req.headers.authorization.split(" ")[0] !== "Bearer") {
      throw new NoToken();
    }

    const token = req.headers.authorization.split(" ")[1]
    cognitoExpress.validate(token, function (err: Error, response: Response) {
      if (err) {
        res.status(StatusCodes.UNAUTHORIZED).send(err)
      } else {
        // res.locals.user = response;
        next();
      }
    });

  } catch (err) {
    next(err);
  }
}