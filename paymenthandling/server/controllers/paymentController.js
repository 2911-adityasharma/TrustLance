const { ethers } = require("ethers");

// Load contract addresses & environment variables
const getEnvVar = (key, fallback = "") => process.env[key] || fallback;

const USDC_ADDRESS = getEnvVar("USDC_ADDRESS", "0x5FbDB2315678afecb367f032d93F642f64180aa3");
const ESCROW_ADDRESS = getEnvVar("ESCROW_ADDRESS", "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512");
const ADMIN_PRIVATE_KEY = getEnvVar("ADMIN_PRIVATE_KEY");
const RPC_URL = getEnvVar("RPC_URL", "http://127.0.0.1:8545");
const CONVERSION_RATE = 83.33; // 1 USDC ≈ ₹83.33

// ABIs
const usdcAbi = [
  "function mint(address to, uint256 amount) external",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)"
];

const escrowAbi = [
  "function createProject(address freelancer, uint256 amount) external returns (uint256)",
  "function releaseFunds(uint256 _projectId) external",
  "function disputeProject(uint256 _projectId) external",
  "function projects(uint256) external view returns (address client, address freelancer, uint256 amount, uint8 state)",
  "function getProjectsCount() external view returns (uint256)"
];

// Helper to get connected Ethers wallet and contract instances
function getContracts() {
  if (!ADMIN_PRIVATE_KEY) {
    throw new Error("Missing ADMIN_PRIVATE_KEY in .env environment file.");
  }
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const baseWallet = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);
  const adminWallet = new ethers.NonceManager(baseWallet);

  const usdc = new ethers.Contract(USDC_ADDRESS, usdcAbi, adminWallet);
  const escrow = new ethers.Contract(ESCROW_ADDRESS, escrowAbi, adminWallet);

  return { provider, baseWallet, adminWallet, usdc, escrow };
}

const STATE_LABELS = ["Active", "Completed", "Disputed", "Resolved"];

/**
 * POST /api/payment/create-escrow
 * Creates a new escrow project on-chain using the Admin Wallet.
 * Body: { freelancerAddress, amountInUSDC, amountInINR }
 */
exports.createEscrow = async (req, res) => {
  try {
    const { freelancerAddress, amountInUSDC, usdcAmount, amountInINR } = req.body;
    const finalAmountUSDC = amountInUSDC || usdcAmount;

    let normalizedFreelancer;
    try {
      if (!freelancerAddress) throw new Error("Missing address");
      normalizedFreelancer = ethers.getAddress(freelancerAddress.toLowerCase());
    } catch {
      return res.status(400).json({ success: false, error: "Invalid freelancer wallet address." });
    }

    if (!finalAmountUSDC || Number(finalAmountUSDC) <= 0) {
      return res.status(400).json({ success: false, error: "Invalid USDC amount." });
    }

    const { baseWallet, usdc, escrow } = getContracts();
    const parsedAmount = ethers.parseUnits(finalAmountUSDC.toString(), 18);

    console.log(`[PaymentController] 🚀 Creating Escrow: Freelancer=${normalizedFreelancer}, Amount=${finalAmountUSDC} USDC`);

    // Step 1: Mint/Deliver USDC to admin wallet for escrow deposit
    console.log("[PaymentController] Step 1/3: Minting/Ensuring USDC balance...");
    try {
      const mintTx = await usdc.mint(baseWallet.address, parsedAmount);
      await mintTx.wait();
    } catch (e) {
      console.log("[PaymentController] Mint skipped or custom USDC used:", e.message);
    }

    // Step 2: Approve Escrow contract to spend USDC
    console.log("[PaymentController] Step 2/3: Approving Escrow Contract...");
    const approveTx = await usdc.approve(ESCROW_ADDRESS, parsedAmount);
    await approveTx.wait();

    // Step 3: Create Project on USDCEscrow Contract
    console.log("[PaymentController] Step 3/3: Executing createProject on-chain...");
    const createTx = await escrow.createProject(normalizedFreelancer, parsedAmount);
    const receipt = await createTx.wait();

    const txHash = receipt.hash || receipt.transactionHash;
    const projectCount = await escrow.getProjectsCount();
    const projectId = Number(projectCount) - 1;

    console.log(`[PaymentController] ✅ Escrow Created! Project ID: #${projectId} | Tx: ${txHash}`);

    return res.json({
      success: true,
      projectId,
      txHash,
      freelancerAddress: normalizedFreelancer,
      amountInUSDC: finalAmountUSDC,
      amountInINR: amountInINR || Math.round(Number(finalAmountUSDC) * CONVERSION_RATE),
      state: "Active"
    });

  } catch (err) {
    console.error("[PaymentController] ❌ createEscrow Error:", err.message);
    return res.status(500).json({
      success: false,
      error: err.reason || err.message || "Failed to create escrow on-chain."
    });
  }
};

/**
 * POST /api/payment/release
 * Releases escrowed funds to the freelancer on-chain.
 * Body: { projectId }
 */
exports.releasePayment = async (req, res) => {
  try {
    const { projectId } = req.body;

    if (projectId === undefined || projectId === null || isNaN(Number(projectId))) {
      return res.status(400).json({ success: false, error: "Invalid or missing projectId." });
    }

    const { escrow } = getContracts();
    console.log(`[PaymentController] 💰 Releasing Funds for Project #${projectId}...`);

    const releaseTx = await escrow.releaseFunds(Number(projectId));
    const receipt = await releaseTx.wait();

    const txHash = receipt.hash || receipt.transactionHash;
    console.log(`[PaymentController] ✅ Funds Released for Project #${projectId}! Tx: ${txHash}`);

    return res.json({
      success: true,
      projectId: Number(projectId),
      txHash,
      status: "Completed",
      message: `Funds for Project #${projectId} successfully released to freelancer on-chain.`
    });

  } catch (err) {
    console.error("[PaymentController] ❌ releasePayment Error:", err.message);
    return res.status(500).json({
      success: false,
      error: err.reason || err.message || "Failed to release funds on-chain."
    });
  }
};

/**
 * GET /api/payment/project/:id
 * Fetches on-chain struct details of a project from USDCEscrow.
 */
exports.getProjectStatus = async (req, res) => {
  try {
    const projectId = req.params.id;

    if (projectId === undefined || isNaN(Number(projectId))) {
      return res.status(400).json({ success: false, error: "Invalid project ID." });
    }

    const { escrow } = getContracts();
    const count = await escrow.getProjectsCount();

    if (Number(projectId) >= Number(count)) {
      return res.status(404).json({ success: false, error: `Project #${projectId} does not exist.` });
    }

    const projectData = await escrow.projects(Number(projectId));
    const stateInt = Number(projectData[3]);

    return res.json({
      success: true,
      projectId: Number(projectId),
      client: projectData[0],
      freelancer: projectData[1],
      amountUSDC: ethers.formatUnits(projectData[2], 18),
      stateInt,
      state: STATE_LABELS[stateInt] || "Unknown"
    });

  } catch (err) {
    console.error("[PaymentController] ❌ getProjectStatus Error:", err.message);
    return res.status(500).json({
      success: false,
      error: err.reason || err.message || "Failed to fetch project status from smart contract."
    });
  }
};

/**
 * POST /api/pay-upi
 * Backward-compatible endpoint for Checkout modal
 */
exports.payUpi = async (req, res) => {
  req.body.amountInUSDC = req.body.usdcAmount;
  return exports.createEscrow(req, res);
};

/**
 * POST /api/webhook/upi
 * Webhook handler for payment gateway events
 */
exports.webhookUpi = async (req, res) => {
  try {
    const { amountInINR, freelancerAddress } = req.body;
    const usdcAmount = Math.round((Number(amountInINR) / CONVERSION_RATE) * 100) / 100;
    req.body.amountInUSDC = usdcAmount;
    req.body.freelancerAddress = freelancerAddress;
    return exports.createEscrow(req, res);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
