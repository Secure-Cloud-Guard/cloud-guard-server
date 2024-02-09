import { Request, Response, NextFunction } from "express";
import { StatusCodes } from 'http-status-codes';

function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
    const statusCode = res.statusCode !== StatusCodes.OK ? res.statusCode : StatusCodes.INTERNAL_SERVER_ERROR;

    res.status(statusCode);
    res.json({
      message: err.message,
      stack: process.env.NODE_ENV === 'production' ? '🍞' : err.stack,
    });
}

export default errorHandler;