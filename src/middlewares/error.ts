import { Request, Response, NextFunction } from "express";
import { StatusCodes } from 'http-status-codes';
import NotFound from "../errors/NotFound";
import CustomError from "../errors/CustomError";

function notFound(req: Request, res: Response, next: NextFunction) {
  res.status(StatusCodes.NOT_FOUND);
  const error = new NotFound(req.originalUrl);
  next(error);
}

function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  let statusCode;

  if (res.statusCode !== StatusCodes.OK) {
    statusCode = res.statusCode;
  } else if (err instanceof CustomError && err.statusCode) {
    statusCode = err.statusCode;
  } else {
    statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  }

  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? '🍞' : err.stack,
  });
}

export { errorHandler, notFound };