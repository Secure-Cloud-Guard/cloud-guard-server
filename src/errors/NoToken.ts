import { StatusCodes } from 'http-status-codes';
import CustomError from "./CustomError";

export default class NoToken extends CustomError {
  constructor() {
    super("🔑 - No token provided", StatusCodes.UNAUTHORIZED);

    // Only because we are extending a built in class
    Object.setPrototypeOf(this, NoToken.prototype);
  }
}