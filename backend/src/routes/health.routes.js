const { Router } = require("express");
const { getHealthStatus } = require("../controllers/health.controller");

const healthRouter = Router();

healthRouter.get("/health", getHealthStatus);

module.exports = { healthRouter };
