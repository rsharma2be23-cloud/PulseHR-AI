const { Router } = require("express");
const { getCurrentUser, login, register } = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");
const { loginSchema, registerSchema } = require("../validators/auth.validator");

const authRouter = Router();

authRouter.post("/register", validate(registerSchema), register);
authRouter.post("/login", validate(loginSchema), login);
authRouter.get("/me", authenticate, getCurrentUser);

module.exports = { authRouter };
