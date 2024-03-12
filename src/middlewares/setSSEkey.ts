import { NextFunction, Request, Response } from "express";
import vaultClient from '../vault/VaultClient';

export const setSSEkey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.locals.sseKey = await vaultClient.getSSEkey(res.locals.userId);
    next();

  } catch (err) {
    next(err);
  }
}