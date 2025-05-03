class ApiError extends Error {
  constructor(statusCode, data = null, message) {
    super(message);
    this.statusCode = statusCode;
    this.data = data;
  }
}

export { ApiError };
