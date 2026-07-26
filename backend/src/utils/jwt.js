const jwt = require("jsonwebtoken");
const { ApiError } = require("./apiError");

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new ApiError(500, "JWT_SECRET is not configured.");
  }

  return process.env.JWT_SECRET;
}

function signAccessToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), email: user.email, role: user.role },
    getJwtSecret(),
    { expiresIn: "1d" },
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, getJwtSecret());
}

module.exports = { signAccessToken, verifyAccessToken };
