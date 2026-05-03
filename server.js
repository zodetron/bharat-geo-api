require("dotenv").config();

const express = require("express");
const cors = require("cors");
const prisma = require("./src/lib/prisma");
const routes = require("./src/routes/index");
const { errorHandler, notFound } = require("./src/middleware/errorHandler");
const { requestLogger } = require("./src/middleware/requestLogger");

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
  : ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176"];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(requestLogger);

// ── Routes ────────────────────────────────────────────────────
app.use("/api/v1", routes);

// ── 404 + Error handlers ─────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────
async function start() {
  try {
    await prisma.$connect();
    console.log("Database connected");

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

start();
