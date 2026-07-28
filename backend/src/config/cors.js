const cors = require("cors");

function getAllowedOrigins() {
  return (process.env.FRONTEND_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function createCorsMiddleware() {
  const allowedOrigins = getAllowedOrigins();

  return cors({
    origin(origin, callback) {
      // Requests without an Origin header include server-to-server calls and
      // command-line health checks; browser origins must be explicitly allowed.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("This origin is not allowed by the CORS policy."));
    },
    methods: ["GET", "POST", "PATCH", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type"],
    optionsSuccessStatus: 204,
  });
}

module.exports = { createCorsMiddleware };
