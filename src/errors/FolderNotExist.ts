import { StatusCodes } from 'http-status-codes';
import CustomError from "./CustomError";

export default class FolderNotExist extends CustomError {
  constructor(message: string) {
    super("📁 - Folder Doesn't Exists - " + message, StatusCodes.NOT_FOUND);

    // Only because we are extending a built-in class
    Object.setPrototypeOf(this, FolderNotExist.prototype);
  }
}