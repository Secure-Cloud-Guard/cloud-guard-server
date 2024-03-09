import { StatusCodes } from 'http-status-codes';
import CustomError from "./CustomError";

export default class ShareWithYourself extends CustomError {
  constructor(message: string) {
    super("📁❌ - You cannot share a folder with yourself - " + message, StatusCodes.NOT_FOUND);

    // Only because we are extending a built-in class
    Object.setPrototypeOf(this, ShareWithYourself.prototype);
  }
}