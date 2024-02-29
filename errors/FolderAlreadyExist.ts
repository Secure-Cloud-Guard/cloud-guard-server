import { StatusCodes } from 'http-status-codes';
import CustomError from "./CustomError";

export default class FolderAlreadyExist extends CustomError {
  constructor(message: string) {
    super("📁 - Folder Already Exists - " + message, StatusCodes.CONFLICT);

    // Only because we are extending a built-in class
    Object.setPrototypeOf(this, FolderAlreadyExist.prototype);
  }
}