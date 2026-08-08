require("dotenv").config();
const express = require("express");
const cors = require("cors");
const paymentRoutes = require("./routes/paymentRoutes");

const app = express();
const PORT = process.env.PORT || process.env.API_PORT || 5000;

// Middleware - Enable CORS for frontend cross-origin requests
app.use(cors());
app.use(express.json());

// API Routes
app.use("/api", paymentRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "USDCEscrow Payment API",
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🚀 USDCEscrow API Server Running on Port ${PORT}`);
  console.log(`   URL: http://localhost:${PORT}`);
  console.log(`   POST http://localhost:${PORT}/api/payment/create-escrow`);
  console.log(`   POST http://localhost:${PORT}/api/payment/release`);
  console.log(`   GET  http://localhost:${PORT}/api/payment/project/:id`);
  console.log(`   POST http://localhost:${PORT}/api/pay-upi`);
  console.log(`==================================================\n`);
});
