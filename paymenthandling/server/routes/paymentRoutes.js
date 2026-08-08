const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");

// Main Escrow API Routes
router.post("/payment/create-escrow", paymentController.createEscrow);
router.post("/payment/release", paymentController.releasePayment);
router.get("/payment/project/:id", paymentController.getProjectStatus);

// UPI & Webhook Compatibility Routes
router.post("/pay-upi", paymentController.payUpi);
router.post("/webhook/upi", paymentController.webhookUpi);

module.exports = router;
