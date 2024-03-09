import { StatusCodes } from 'http-status-codes';
import CustomError from "./CustomError";

export default class MaxSize extends CustomError {
  constructor(maxSize: number, type: string, message: string) {
    super("📈 - Max " + type + " Size Exceeded (max. size " + maxSize + " MB) - " + message, StatusCodes.BAD_REQUEST);

    // Only because we are extending a built in class
    Object.setPrototypeOf(this, MaxSize.prototype);
  }
}