const { loginUser, registerUser } = require("../services/auth.service");

async function register(request, response, next) {
  try {
    const result = await registerUser(request.body);
    response.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function login(request, response, next) {
  try {
    const result = await loginUser(request.body);
    response.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

function getCurrentUser(request, response) {
  response.status(200).json({ success: true, data: { user: request.user } });
}

module.exports = { register, login, getCurrentUser };
