import { Router } from "express";
import CognitoService from "../services/cognito.ts";

const CognitoRouter = Router();

CognitoRouter.get('/user', CognitoService.getUser);

export { CognitoRouter };