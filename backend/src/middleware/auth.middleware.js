const { ApiError } = require("../utils/apiError");
const { verifyAccessToken } = require("../utils/jwt");

function authenticate(request, _response, next) {
  const authorization = request.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return next(new ApiError(401, "Authentication token is required."));
  }

  const token = authorization.slice(7);

  try {
    request.user = verifyAccessToken(token);
    return next();
  } catch (error) {
    if (error.statusCode) {
      return next(error);
    }

    return next(new ApiError(401, "Invalid or expired authentication token."));
  }
}

module.exports = { authenticate };
