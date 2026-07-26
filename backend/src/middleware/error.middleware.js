function errorHandler(error, _request, response, _next) {
  const statusCode = error.statusCode || (error.code === 11000 ? 409 : error.name === "ValidationError" ? 400 : 500);
  const message = statusCode >= 500 ? "Internal server error." : error.message;

  const body = { success: false, message };

  if (error.details) {
    body.details = error.details;
  }

  response.status(statusCode).json(body);
}

module.exports = { errorHandler };
