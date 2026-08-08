const express = require("express");
const { ethers } = require("ethers");
const router = express.Router();

// Load contract addresses & credentials from environment variables
const USDC_ADDRESS = process.env.USDC_ADDRESS;
const ESCROW_ADDRESS = process.env.ESCROW_ADDRESS;
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL;
const CONVERSION_RATE = 83.33; // 1 USDC ≈ ₹83.33

// Minimal ABIs
const usdcAbi = [
  "function mint(address to, uint256 amount) external",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)"
];

const escrowAbi = [
  "function createProject(address freelancer, uint256 amount) external returns (uint256)",
  "function getProjectsCount() external view returns (uint256)"
];

// Helper function to execute on-chain escrow project creation
async function executeOnChainEscrow(freelancerAddress, usdcAmount, amountInINR) {
  const normalizedFreelancer = ethers.getAddress(freelancerAddress.toLowerCase());
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const baseWallet = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);
  const adminWallet = new ethers.NonceManager(baseWallet);

  const usdc = new ethers.Contract(USDC_ADDRESS, usdcAbi, adminWallet);
  const escrow = new ethers.Contract(ESCROW_ADDRESS, escrowAbi, adminWallet);

  const parsedAmount = ethers.parseUnits(usdcAmount.toString(), 18);

  console.log(`[Payment Relayer] Executing on-chain escrow lock for ${normalizedFreelancer} (${usdcAmount} USDC)`);

  // Step 1: Mint/Deliver USDC to admin relayer wallet
  const mintTx = await usdc.mint(baseWallet.address, parsedAmount);
  await mintTx.wait();

  // Step 2: Approve Escrow smart contract
  const approveTx = await usdc.approve(ESCROW_ADDRESS, parsedAmount);
  await approveTx.wait();

  // Step 3: Call createProject on-chain
  const createTx = await escrow.createProject(normalizedFreelancer, parsedAmount);
  const receipt = await createTx.wait();

  const txHash = receipt.hash || receipt.transactionHash;
  const projectCount = await escrow.getProjectsCount();
  const projectId = Number(projectCount) - 1;

  console.log(`[Payment Relayer] ✅ Escrow created on-chain! Tx: ${txHash} | Project ID: ${projectId}`);

  return {
    txHash,
    projectId,
    usdcAmount,
    amountInINR,
    freelancerAddress: normalizedFreelancer,
  };
}

/**
 * POST /api/pay-upi
 * 
 * Direct Relayer Endpoint (Used for instant Checkout & Hackathon Demo)
 */
router.post("/pay-upi", async (req, res) => {
  try {
    const { freelancerAddress, amountInINR, usdcAmount } = req.body;

    let normalizedFreelancer;
    try {
      if (!freelancerAddress) throw new Error("Missing address");
      normalizedFreelancer = ethers.getAddress(freelancerAddress.toLowerCase());
    } catch {
      return res.status(400).json({ success: false, error: "Invalid freelancer wallet address." });
    }

    if (!usdcAmount || Number(usdcAmount) <= 0) {
      return res.status(400).json({ success: false, error: "Invalid USDC amount." });
    }

    const result = await executeOnChainEscrow(normalizedFreelancer, usdcAmount, amountInINR);

    return res.json({
      success: true,
      ...result,
    });

  } catch (err) {
    console.error("[Payment API] ❌ Error:", err.message);
    return res.status(500).json({
      success: false,
      error: err.reason || err.message || "Backend transaction failed."
    });
  }
});

/**
 * POST /api/webhook/upi
 * 
 * Production Payment Gateway Webhook Endpoint (Razorpay / Cashfree / Onramp.money)
 * Receives verified payment confirmation after real INR UPI transaction completes,
 * then automatically triggers on-chain escrow project creation using the Relayer wallet.
 */
router.post("/webhook/upi", async (req, res) => {
  try {
    const { event, paymentId, amountInINR, freelancerAddress, metadata } = req.body;

    console.log(`[Production Webhook] Received UPI payment notification (${paymentId}): ₹${amountInINR} INR`);

    const usdcAmount = Math.round((Number(amountInINR) / CONVERSION_RATE) * 100) / 100;
    const rawFreelancer = freelancerAddress || metadata?.freelancerAddress;

    let normalizedFreelancer;
    try {
      if (!rawFreelancer) throw new Error("Missing address");
      normalizedFreelancer = ethers.getAddress(rawFreelancer.toLowerCase());
    } catch {
      return res.status(400).json({ success: false, error: "Invalid freelancer address in webhook payload." });
    }

    // Execute automated smart contract escrow lock
    const result = await executeOnChainEscrow(normalizedFreelancer, usdcAmount, amountInINR);

    return res.json({
      success: true,
      message: "Webhook processed and escrow locked on-chain",
      paymentId,
      ...result,
    });
  } catch (err) {
    console.error("[Production Webhook] ❌ Webhook processing failed:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
