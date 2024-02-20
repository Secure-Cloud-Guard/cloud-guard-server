import { Request, Response, NextFunction } from "express";
import cognitoClient from "../aws/cognitoProviderClient";

const CognitoService = {
  getUser: async function(req: Request, res: Response, next: NextFunction) {
    try {
      const { UserAttributes, Username } = await cognitoClient.getUser(req.headers.authorization?.split(" ")[1] as string);
      res.json({ UserAttributes, Username });

    } catch (error) {
      next(error);
    }
  },
};

export default CognitoService;