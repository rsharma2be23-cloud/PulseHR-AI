const express = require("express");
const { errorHandler } = require("./middleware/error.middleware");
const { authRouter } = require("./routes/auth.routes");
const { healthRouter } = require("./routes/health.routes");

const app = express();

app.use(express.json());
app.use("/api/v1", healthRouter);
app.use("/api/v1/auth", authRouter);
app.use(errorHandler);

module.exports = app;
