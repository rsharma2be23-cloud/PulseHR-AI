require("dotenv/config");

const app = require("./app");
const { connectDatabase } = require("./config/database");

const port = Number(process.env.PORT) || 5000;

async function startServer() {
  try {
    await connectDatabase();

    app.listen(port, () => {
      console.log(`PulseHR API listening on port ${port}`);
    });
  } catch (error) {
    console.error("Unable to connect to MongoDB. The API was not started.", error);
    process.exit(1);
  }
}

void startServer();
