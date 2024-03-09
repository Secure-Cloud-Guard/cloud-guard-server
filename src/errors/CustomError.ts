
export default class CustomError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;

    // Only because we are extending a built in class
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}