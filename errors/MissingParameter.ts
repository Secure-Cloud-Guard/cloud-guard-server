import { StatusCodes } from 'http-status-codes';
import CustomError from "./CustomError";

export default class MissingParameter extends CustomError {
  constructor(message: string) {
    super("🚨 - Missing Parameter - " + message, StatusCodes.BAD_REQUEST);

    // Only because we are extending a built in class
    Object.setPrototypeOf(this, MissingParameter.prototype);
  }
}