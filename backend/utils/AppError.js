class AppError extends Error {
  constructor(message, statusCode, code = "APP_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
  }
}

export default AppError;