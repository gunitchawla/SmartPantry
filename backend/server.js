const express = require("express");
const cors = require("cors");
require("dotenv").config();

const storageService = require("./services/storageService");
const notificationService = require("./services/notificationService");
const exportService = require("./services/exportService");
const productRoutes = require("./routes/products");

const app = express();

// Security & Parsing Middleware
app.use(cors({ origin: "*" }));
app.use(express.json());

// Prevent browser/client from caching dynamic API responses
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  next();
});

// Automated Health & Cloud Infrastructure Verification Endpoint
app.get("/health", async (req, res) => {
  try {
    const storageHealth = await storageService.checkHealth();
    const snsStatus = notificationService.getStatus();
    const s3Status = exportService.getStatus();

    const health = {
      status: "healthy",
      service: "smartpantry-backend",
      timestamp: new Date().toISOString(),
      uptime_seconds: process.uptime(),
      cloud_environment: {
        region: process.env.AWS_REGION || "us-east-1",
        mode: process.env.NODE_ENV || "development",
        db_type: process.env.DB_TYPE || "dynamodb",
      },
      managed_services: {
        dynamodb: storageHealth,
        sns: snsStatus,
        s3: s3Status,
      },
    };

    res.status(200).json(health);
  } catch (error) {
    res.status(500).json({
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Mount Products Route
app.use("/products", productRoutes);

// Root Welcome Endpoint
app.get("/", (req, res) => {
  res.json({
    message: "🥫 SmartPantry Cloud API is running",
    version: "2.0.0",
    health_check: "/health",
    products_endpoint: "/products",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`=========================================`);
  console.log(`🥫 SmartPantry Cloud Backend running on port ${PORT}`);
  console.log(`📍 Region: ${process.env.AWS_REGION || "us-east-1"}`);
  console.log(`🗄️  Storage: ${process.env.DYNAMODB_TABLE_NAME || "smartpantry-inventory"}`);
  console.log(`🔔 SNS Alerts Topic: ${process.env.SNS_TOPIC_ARN || "Local/Mock"}`);
  console.log(`🪣 S3 Bucket: ${process.env.S3_BUCKET_NAME || "Local/Mock"}`);
  console.log(`=========================================`);
});

module.exports = app;