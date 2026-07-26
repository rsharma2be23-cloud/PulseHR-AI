const bcrypt = require("bcrypt");
const { ROLES } = require("../config/roles");
const { User } = require("../models/user.model");
const { ApiError } = require("../utils/apiError");
const { signAccessToken } = require("../utils/jwt");

function toPublicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
  };
}

async function registerUser({ name, email, password }) {
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new ApiError(409, "An account with this email already exists.");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const user = await User.create({
      name,
      email,
      passwordHash,
      role: ROLES.EMPLOYEE,
    });

    return { user: toPublicUser(user), token: signAccessToken(user) };
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(409, "An account with this email already exists.");
    }

    throw error;
  }
}

async function loginUser({ email, password }) {
  const user = await User.findOne({ email }).select("+passwordHash");

  if (!user || !user.isActive) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    throw new ApiError(401, "Invalid email or password.");
  }

  return { user: toPublicUser(user), token: signAccessToken(user) };
}

module.exports = { registerUser, loginUser };
