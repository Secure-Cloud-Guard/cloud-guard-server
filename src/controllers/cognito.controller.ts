import { Request, Response, NextFunction } from "express";
import CognitoService from "../services/cognito.service";

const CognitoController = {
  getCurrentUser: async function(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await CognitoService.getCurrentUser(req.headers.authorization?.split(" ")[1] as string));

    } catch (error) {
      next(error);
    }
  },
};

export default CognitoController;