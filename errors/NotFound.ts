import { StatusCodes } from 'http-status-codes';
import CustomError from "./CustomError.ts";

export default class NotFound extends CustomError {
  constructor(message: string) {
    super("🔍 - Not Found - " + message, StatusCodes.NOT_FOUND);

    // Only because we are extending a built in class
    Object.setPrototypeOf(this, NotFound.prototype);
  }
}