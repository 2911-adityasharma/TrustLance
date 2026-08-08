const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

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

  // Save deployed addresses for frontend and backend consumption
  const addressesPath = path.join(__dirname, "../frontend/addresses.json");
  if (!fs.existsSync(path.dirname(addressesPath))) {
    fs.mkdirSync(path.dirname(addressesPath), { recursive: true });
  }

  fs.writeFileSync(
    addressesPath,
    JSON.stringify({
      network: network.name,
      mockUSDC: mockUSDCAddress,
      usdcEscrow: usdcEscrowAddress,
      deployer: deployer.address,
      deployedAt: new Date().toISOString()
    }, null, 2)
  );

  console.log(`\n==================================================`);
  console.log(`🎉 Deployment Complete!`);
  console.log(`   USDC Contract  : ${mockUSDCAddress}`);
  console.log(`   Escrow Contract: ${usdcEscrowAddress}`);
  console.log(`   Saved to       : frontend/addresses.json`);
  console.log(`==================================================\n`);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
