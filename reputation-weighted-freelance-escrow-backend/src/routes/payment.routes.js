import { Router } from "express";
import {
  createEscrow,
  releasePayment,
  getProjectStatus,
  payUpi,
  webhookUpi
} from "../controllers/payment.controller.js";

const router = Router();

// Main Escrow API Routes
router.post("/payment/create-escrow", createEscrow);
router.post("/payment/release", releasePayment);
router.get("/payment/project/:id", getProjectStatus);

// UPI & Webhook Compatibility Routes
router.post("/pay-upi", payUpi);
router.post("/webhook/upi", webhookUpi);

export default router;
