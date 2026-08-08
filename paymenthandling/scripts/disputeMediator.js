const { ethers } = require("hardhat");
// Note: In your actual backend, you would install the Gemini SDK:
// npm install @google/generative-ai
// import { GoogleGenAI } from "@google/generative-ai";

/**
 * Simulates calling the Gemini/LLM model to analyze dispute evidence.
 * 
 * In a real application, you would pass chat history, deliverables, and guidelines.
 * The model is instructed to output a JSON block with its reasoning and a client percentage.
 */
async function callLLMMediator(disputeContext) {
  console.log("\n--- Sending Context to LLM ---");
  console.log(`Analyzing dispute for Project #${disputeContext.projectId}`);
  console.log(`Agreement: ${disputeContext.description}`);
  console.log(`Dispute reason: ${disputeContext.complaint}`);
  console.log("------------------------------");

  // Mocking the LLM Response
  // A typical prompt would enforce structured JSON output:
  // "Determine the percentage of funds (0-100) that should go to the client. Output JSON: { \"clientShare\": 40, \"reason\": \"...\" }"
  
  // Let's simulate a decision based on the complaint
  let clientShare = 50; // Default split
  let reasoning = "Evidence is inconclusive. Splitting funds equally.";

  if (disputeContext.complaint.includes("ghosted") || disputeContext.complaint.includes("no work delivered")) {
    clientShare = 100;
    reasoning = "Freelancer did not submit any work and stopped communication (Ghosting). Client is refunded 100%.";
  } else if (disputeContext.complaint.includes("mostly done but missed final styling")) {
    clientShare = 20;
    reasoning = "Freelancer delivered 80% of the milestone features. 20% refund to client for missing final styles.";
  }

  // Simulate latency
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    clientSharePercent: clientShare,
    reasoning: reasoning
  };
}

async function main() {
  // 1. Get contract and signers (The backend mediator must be the Owner of the contract)
  const [owner] = await ethers.getSigners();
  
  // Let's assume we have deployed the USDCEscrow contract and have its address
  // For demo, we get the local deployment from hardhat
  const escrowAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; 
  console.log(`Connecting to USDCEscrow contract at: ${escrowAddress}`);
  
  const USDCEscrow = await ethers.getContractFactory("USDCEscrow");
  // In a real environment, you attach to the deployed address:
  // const escrow = USDCEscrow.attach(escrowAddress);
  
  // For the sake of a runnable demo, we deploy a mock instance here:
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy();
  await mockUSDC.waitForDeployment();
  const escrow = await USDCEscrow.deploy(await mockUSDC.getAddress());
  await escrow.waitForDeployment();
  
  // Create a project to dispute
  const [,, freelancer] = await ethers.getSigners();
  const depositAmount = ethers.parseUnits("1000", 18);
  await mockUSDC.mint(owner.address, depositAmount);
  await mockUSDC.approve(await escrow.getAddress(), depositAmount);
  await escrow.createProject(freelancer.address, depositAmount);
  console.log("Project #0 created in Active state.");

  // 2. Client files a dispute (simulate off-chain triggers or event listener)
  console.log("Client flags project #0 as Disputed...");
  await escrow.disputeProject(0);

  // 3. Compile the context for the LLM
  const disputeContext = {
    projectId: 0,
    description: "Build a responsive React application profile screen.",
    complaint: "The freelancer ghosted me and has not responded for 10 days, no code was delivered.",
  };

  // 4. Call the LLM to get the split percentage
  const aiDecision = await callLLMMediator(disputeContext);
  console.log(`\nAI Decision:`);
  console.log(`- Recommended Client Refund: ${aiDecision.clientSharePercent}%`);
  console.log(`- Recommended Freelancer Share: ${100 - aiDecision.clientSharePercent}%`);
  console.log(`- Reason: ${aiDecision.reasoning}`);

  // 5. Submit transaction to the blockchain from the Owner (mediator) wallet
  console.log("\nSubmitting AI-determined dispute resolution to the blockchain...");
  
  const tx = await escrow.connect(owner).resolveDispute(0, aiDecision.clientSharePercent);
  const receipt = await tx.wait();
  
  console.log(`Transaction successful! Hash: ${receipt.hash}`);
  
  // Verify state on-chain
  const project = await escrow.projects(0);
  const states = ["Active", "Completed", "Disputed", "Resolved"];
  console.log(`On-chain Project State updated to: ${states[project.state]}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
