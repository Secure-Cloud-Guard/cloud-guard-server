import { NextFunction, Request, Response } from "express";
import MissingParameter from "../errors/MissingParameter";

export const setObjectKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { objectKey } = req.params;

    if (!objectKey) throw new MissingParameter('Object key is required');

    res.locals.objectKey = objectKey + req.params[0] ?? '';
    next();

  } catch (err) {
    next(err);
  }
}