import hre from "hardhat";
const { ethers, network } = hre;
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log(`\n==================================================`);
  console.log(`🚀 Deploying USDCEscrow Smart Contracts`);
  console.log(`   Network: ${network.name}`);
  console.log(`==================================================\n`);

  const [deployer] = await ethers.getSigners();
  console.log("Deployer Wallet Address:", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer Native Balance:", ethers.formatEther(balance), "ETH/MATIC\n");

  let mockUSDCAddress = process.env.USDC_ADDRESS;

  // If USDC address is not provided in env or deploying to localhost/testnet, deploy MockUSDC
  if (!mockUSDCAddress || network.name === "localhost" || network.name === "hardhat") {
    console.log("1. Deploying MockUSDC token contract...");
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUSDC = await MockUSDC.deploy();
    await mockUSDC.waitForDeployment();
    mockUSDCAddress = await mockUSDC.getAddress();
    console.log("   ✅ MockUSDC deployed at:", mockUSDCAddress);
  } else {
    console.log("1. Using existing USDC token contract at:", mockUSDCAddress);
  }

  // Deploy USDCEscrow
  console.log("2. Deploying USDCEscrow contract...");
  const USDCEscrow = await ethers.getContractFactory("USDCEscrow");
  const usdcEscrow = await USDCEscrow.deploy(mockUSDCAddress);
  await usdcEscrow.waitForDeployment();
  const usdcEscrowAddress = await usdcEscrow.getAddress();
  console.log("   ✅ USDCEscrow deployed at:", usdcEscrowAddress);

  // Save deployed addresses
  const addressData = {
    network: network.name,
    mockUSDC: mockUSDCAddress,
    usdcEscrow: usdcEscrowAddress,
    deployer: deployer.address,
    deployedAt: new Date().toISOString()
  };

  // Write to src/config/addresses.json
  const configPath = path.join(__dirname, "../src/config/addresses.json");
  fs.writeFileSync(configPath, JSON.stringify(addressData, null, 2));
  console.log(`   Saved config to: src/config/addresses.json`);

  // Write to ../frontend/addresses.json (if frontend directory exists)
  const frontendPath = path.join(__dirname, "../../frontend/addresses.json");
  try {
    if (fs.existsSync(path.dirname(frontendPath))) {
      fs.writeFileSync(frontendPath, JSON.stringify(addressData, null, 2));
      console.log(`   Saved config to: ../frontend/addresses.json`);
    } else {
      // Create frontend folder at sibling level if needed, or skip
      fs.mkdirSync(path.dirname(frontendPath), { recursive: true });
      fs.writeFileSync(frontendPath, JSON.stringify(addressData, null, 2));
      console.log(`   Saved config to sibling frontend/addresses.json`);
    }
  } catch (err) {
    console.log("   Skipped saving to frontend path:", err.message);
  }

  console.log(`\n==================================================`);
  console.log(`🎉 Deployment Complete!`);
  console.log(`   USDC Contract  : ${mockUSDCAddress}`);
  console.log(`   Escrow Contract: ${usdcEscrowAddress}`);
  console.log(`==================================================\n`);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
