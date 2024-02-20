import { Router } from "express";
import CognitoService from "../services/cognito";

const CognitoRouter = Router();

CognitoRouter.get('/user', CognitoService.getUser);

export { CognitoRouter };