/**
 * Automated Payment API Integration Test Script
 * 
 * Tests the full escrow lifecycle in sequence:
 *   1. POST /api/payment/create-escrow → Creates escrow, extracts projectId & txHash
 *   2. GET  /api/payment/project/:id   → Verifies on-chain state is "Active"
 *   3. POST /api/payment/release       → Releases funds to freelancer
 *   4. GET  /api/payment/project/:id   → Verifies state changed to "Completed"
 * 
 * Usage: node scripts/testPaymentApi.js
 * Requires: Backend server running on port 5000, Hardhat node running on 8545
 */

import axios from "axios";

const BASE_URL = "http://localhost:5000";
const TEST_FREELANCER = "0x3C44Cddb6a900fa2b585dd299e03d12FA4293BCF"; // Hardhat Account #2
const TEST_AMOUNT_USDC = 50;
const TEST_AMOUNT_INR = 4167;

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    passed++;
    console.log(`  ✅ PASS: ${label}`);
  } else {
    failed++;
    console.log(`  ❌ FAIL: ${label}`);
  }
}

async function runTests() {
  console.log("\n==================================================");
  console.log("🧪 Payment API Integration Test Suite");
  console.log(`   Target: ${BASE_URL}`);
  console.log("==================================================\n");

  let projectId;
  let createTxHash;

  // ─────────────────────────────────────────────────
  // STEP 1: POST /api/payment/create-escrow
  // ─────────────────────────────────────────────────
  console.log("── Step 1: POST /api/payment/create-escrow ──");
  try {
    const createRes = await axios.post(`${BASE_URL}/api/payment/create-escrow`, {
      freelancerAddress: TEST_FREELANCER,
      amountInUSDC: TEST_AMOUNT_USDC,
      amountInINR: TEST_AMOUNT_INR,
    });

    assert(createRes.status === 200, "Response status is 200");
    assert(createRes.data.success === true, "success === true");
    assert(typeof createRes.data.projectId === "number", "projectId is a number");
    assert(
      typeof createRes.data.txHash === "string" && createRes.data.txHash.startsWith("0x"),
      "txHash is a valid hex string (starts with 0x)"
    );
    assert(createRes.data.state === "Active", 'state === "Active"');

    projectId = createRes.data.projectId;
    createTxHash = createRes.data.txHash;

    console.log(`  📋 Extracted projectId: ${projectId}`);
    console.log(`  📋 Extracted txHash: ${createTxHash}\n`);
  } catch (err) {
    failed++;
    console.log(`  ❌ FAIL: Request failed — ${err.response?.data?.error || err.message}\n`);
    printSummary();
    process.exit(1);
  }

  // ─────────────────────────────────────────────────
  // STEP 2: GET /api/payment/project/:id
  // ─────────────────────────────────────────────────
  console.log(`── Step 2: GET /api/payment/project/${projectId} ──`);
  try {
    const statusRes = await axios.get(`${BASE_URL}/api/payment/project/${projectId}`);

    assert(statusRes.status === 200, "Response status is 200");
    assert(statusRes.data.success === true, "success === true");
    assert(statusRes.data.projectId === projectId, `projectId matches (${projectId})`);
    assert(statusRes.data.state === "Active", 'On-chain state === "Active"');
    assert(statusRes.data.amountUSDC === `${TEST_AMOUNT_USDC}.0`, `amountUSDC === "${TEST_AMOUNT_USDC}.0"`);
    assert(
      statusRes.data.freelancer.toLowerCase() === TEST_FREELANCER.toLowerCase(),
      "Freelancer address matches"
    );

    console.log(`  📋 Client: ${statusRes.data.client}`);
    console.log(`  📋 Freelancer: ${statusRes.data.freelancer}`);
    console.log(`  📋 Amount: ${statusRes.data.amountUSDC} USDC`);
    console.log(`  📋 State: ${statusRes.data.state}\n`);
  } catch (err) {
    failed++;
    console.log(`  ❌ FAIL: Request failed — ${err.response?.data?.error || err.message}\n`);
  }

  // ─────────────────────────────────────────────────
  // STEP 3: POST /api/payment/release
  // ─────────────────────────────────────────────────
  console.log(`── Step 3: POST /api/payment/release (Project #${projectId}) ──`);
  try {
    const releaseRes = await axios.post(`${BASE_URL}/api/payment/release`, {
      projectId: projectId,
    });

    assert(releaseRes.status === 200, "Response status is 200");
    assert(releaseRes.data.success === true, "success === true");
    assert(releaseRes.data.projectId === projectId, `projectId matches (${projectId})`);
    assert(
      typeof releaseRes.data.txHash === "string" && releaseRes.data.txHash.startsWith("0x"),
      "txHash is a valid hex string (starts with 0x)"
    );
    assert(releaseRes.data.status === "Completed", 'status === "Completed"');

    console.log(`  📋 Release txHash: ${releaseRes.data.txHash}`);
    console.log(`  📋 Message: ${releaseRes.data.message}\n`);
  } catch (err) {
    failed++;
    console.log(`  ❌ FAIL: Request failed — ${err.response?.data?.error || err.message}\n`);
  }

  // ─────────────────────────────────────────────────
  // STEP 4: Verify state changed to Completed
  // ─────────────────────────────────────────────────
  console.log(`── Step 4: GET /api/payment/project/${projectId} (Post-Release Verification) ──`);
  try {
    const verifyRes = await axios.get(`${BASE_URL}/api/payment/project/${projectId}`);

    assert(verifyRes.status === 200, "Response status is 200");
    assert(verifyRes.data.state === "Completed", 'On-chain state changed to "Completed"');

    console.log(`  📋 Final State: ${verifyRes.data.state}\n`);
  } catch (err) {
    failed++;
    console.log(`  ❌ FAIL: Request failed — ${err.response?.data?.error || err.message}\n`);
  }

  printSummary();
}

function printSummary() {
  const total = passed + failed;
  console.log("==================================================");
  console.log(`🧪 Test Results: ${passed}/${total} passed, ${failed} failed`);
  if (failed === 0) {
    console.log("🎉 ALL TESTS PASSED!");
  } else {
    console.log("⚠️  Some tests failed. Check logs above.");
  }
  console.log("==================================================\n");
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
