import { Router } from "express";
import CognitoController from "../controllers/cognito.controller";

const CognitoRouter = Router();

CognitoRouter.get('/user', CognitoController.getCurrentUser);

export { CognitoRouter };