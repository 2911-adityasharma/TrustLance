const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("USDCEscrow", function () {
  // Helper to deploy contracts and set up standard test state
  async function deployEscrowFixture() {
    const [owner, client, freelancer, other] = await ethers.getSigners();

    // Deploy Mock USDC Token
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUSDC = await MockUSDC.deploy();
    if (mockUSDC.waitForDeployment) {
      await mockUSDC.waitForDeployment();
    } else {
      await mockUSDC.deployed();
    }

    const mockUSDCAddress = mockUSDC.target || mockUSDC.address;

    // Deploy USDCEscrow Contract with Mock USDC address
    const USDCEscrow = await ethers.getContractFactory("USDCEscrow");
    const usdcEscrow = await USDCEscrow.deploy(mockUSDCAddress);
    if (usdcEscrow.waitForDeployment) {
      await usdcEscrow.waitForDeployment();
    } else {
      await usdcEscrow.deployed();
    }

    const usdcEscrowAddress = usdcEscrow.target || usdcEscrow.address;

    // Mint USDC for client and approve the escrow contract
    const depositAmount = ethers.parseUnits("500", 18); // 500 USDC
    await mockUSDC.mint(client.address, depositAmount);
    await mockUSDC.connect(client).approve(usdcEscrowAddress, depositAmount);

    return { usdcEscrow, mockUSDC, owner, client, freelancer, other, depositAmount };
  }

  describe("Deployment", function () {
    it("Should set the correct token address and owner", async function () {
      const { usdcEscrow, mockUSDC, owner } = await loadFixture(deployEscrowFixture);
      const tokenAddress = await usdcEscrow.usdcToken();
      const contractOwner = await usdcEscrow.owner();

      const expectedTokenAddress = mockUSDC.target || mockUSDC.address;
      expect(tokenAddress).to.equal(expectedTokenAddress);
      expect(contractOwner).to.equal(owner.address);
    });
  });

  describe("Project Creation", function () {
    it("Should successfully create a project, lock funds, and emit ProjectCreated", async function () {
      const { usdcEscrow, mockUSDC, client, freelancer, depositAmount } = await loadFixture(deployEscrowFixture);

      const usdcEscrowAddress = usdcEscrow.target || usdcEscrow.address;

      // Create project
      await expect(usdcEscrow.connect(client).createProject(freelancer.address, depositAmount))
        .to.emit(usdcEscrow, "ProjectCreated")
        .withArgs(0, client.address, freelancer.address, depositAmount);

      // Verify contract holds the locked funds and client's balance is zero
      expect(await mockUSDC.balanceOf(usdcEscrowAddress)).to.equal(depositAmount);
      expect(await mockUSDC.balanceOf(client.address)).to.equal(0);

      // Verify project details
      const project = await usdcEscrow.projects(0);
      expect(project.client).to.equal(client.address);
      expect(project.freelancer).to.equal(freelancer.address);
      expect(project.amount).to.equal(depositAmount);
      expect(project.state).to.equal(0); // ProjectState.Active

      expect(await usdcEscrow.getProjectsCount()).to.equal(1);
    });

    it("Should revert if freelancer address is zero", async function () {
      const { usdcEscrow, client, depositAmount } = await loadFixture(deployEscrowFixture);
      await expect(
        usdcEscrow.connect(client).createProject(ethers.ZeroAddress, depositAmount)
      ).to.be.revertedWith("USDCEscrow: Freelancer address cannot be zero");
    });

    it("Should revert if client tries to set themselves as freelancer", async function () {
      const { usdcEscrow, client, depositAmount } = await loadFixture(deployEscrowFixture);
      await expect(
        usdcEscrow.connect(client).createProject(client.address, depositAmount)
      ).to.be.revertedWith("USDCEscrow: Client and freelancer cannot be the same address");
    });

    it("Should revert if amount is zero", async function () {
      const { usdcEscrow, client, freelancer } = await loadFixture(deployEscrowFixture);
      await expect(
        usdcEscrow.connect(client).createProject(freelancer.address, 0)
      ).to.be.revertedWith("USDCEscrow: Amount must be greater than zero");
    });

    it("Should revert if client has not approved enough USDC", async function () {
      const { usdcEscrow, client, freelancer, depositAmount } = await loadFixture(deployEscrowFixture);
      // Double the deposit amount so approval is insufficient
      const doubleAmount = depositAmount * 2n;
      await expect(
        usdcEscrow.connect(client).createProject(freelancer.address, doubleAmount)
      ).to.be.reverted; // Reverted by ERC20 transferFrom
    });
  });

  describe("Funds Release", function () {
    async function activeProjectFixture() {
      const state = await deployEscrowFixture();
      const { usdcEscrow, client, freelancer, depositAmount } = state;
      await usdcEscrow.connect(client).createProject(freelancer.address, depositAmount);
      return state;
    }

    it("Should allow the client to release funds, transfer 100% to freelancer, and update reputations", async function () {
      const { usdcEscrow, mockUSDC, client, freelancer, depositAmount } = await loadFixture(activeProjectFixture);

      const usdcEscrowAddress = usdcEscrow.target || usdcEscrow.address;

      // Release funds
      await expect(usdcEscrow.connect(client).releaseFunds(0))
        .to.emit(usdcEscrow, "FundsReleased")
        .withArgs(0, freelancer.address, depositAmount);

      // Verify balances
      expect(await mockUSDC.balanceOf(usdcEscrowAddress)).to.equal(0);
      expect(await mockUSDC.balanceOf(freelancer.address)).to.equal(depositAmount);

      // Verify state
      const project = await usdcEscrow.projects(0);
      expect(project.state).to.equal(1); // ProjectState.Completed

      // Verify reputation scores updated
      expect(await usdcEscrow.reputation(client.address)).to.equal(1);
      expect(await usdcEscrow.reputation(freelancer.address)).to.equal(1);
    });

    it("Should revert if caller is not the client", async function () {
      const { usdcEscrow, freelancer } = await loadFixture(activeProjectFixture);
      await expect(
        usdcEscrow.connect(freelancer).releaseFunds(0)
      ).to.be.revertedWith("USDCEscrow: Only the client can release funds");
    });

    it("Should revert if the project is already completed", async function () {
      const { usdcEscrow, client } = await loadFixture(activeProjectFixture);
      await usdcEscrow.connect(client).releaseFunds(0);

      await expect(
        usdcEscrow.connect(client).releaseFunds(0)
      ).to.be.revertedWith("USDCEscrow: Project is not active");
    });
  });

  describe("Dispute Resolution", function () {
    async function activeProjectFixture() {
      const state = await deployEscrowFixture();
      const { usdcEscrow, client, freelancer, depositAmount } = state;
      await usdcEscrow.connect(client).createProject(freelancer.address, depositAmount);
      return state;
    }

    it("Should allow client or freelancer to dispute a project", async function () {
      const { usdcEscrow, client } = await loadFixture(activeProjectFixture);

      await expect(usdcEscrow.connect(client).disputeProject(0))
        .to.emit(usdcEscrow, "ProjectDisputed")
        .withArgs(0, client.address);

      const project = await usdcEscrow.projects(0);
      expect(project.state).to.equal(2); // ProjectState.Disputed
    });

    it("Should allow owner to resolve a dispute with a split and update reputations", async function () {
      const { usdcEscrow, mockUSDC, owner, client, freelancer, depositAmount } = await loadFixture(activeProjectFixture);

      const usdcEscrowAddress = usdcEscrow.target || usdcEscrow.address;

      // Flag as disputed first
      await usdcEscrow.connect(client).disputeProject(0);

      // Resolve dispute: 40% client share, 60% freelancer share
      const clientSharePercent = 40;
      const expectedClientAmount = (depositAmount * 40n) / 100n;
      const expectedFreelancerAmount = depositAmount - expectedClientAmount;

      await expect(usdcEscrow.connect(owner).resolveDispute(0, clientSharePercent))
        .to.emit(usdcEscrow, "DisputeResolved")
        .withArgs(0, expectedClientAmount, expectedFreelancerAmount);

      // Verify balances
      expect(await mockUSDC.balanceOf(usdcEscrowAddress)).to.equal(0);
      expect(await mockUSDC.balanceOf(client.address)).to.equal(expectedClientAmount);
      expect(await mockUSDC.balanceOf(freelancer.address)).to.equal(expectedFreelancerAmount);

      // Verify state
      const project = await usdcEscrow.projects(0);
      expect(project.state).to.equal(3); // ProjectState.Resolved

      // Verify reputations updated
      expect(await usdcEscrow.reputation(client.address)).to.equal(1);
      expect(await usdcEscrow.reputation(freelancer.address)).to.equal(1);
    });

    it("Should allow owner to resolve a dispute directly from Active state", async function () {
      const { usdcEscrow, owner, client, freelancer } = await loadFixture(activeProjectFixture);

      // Resolve dispute without explicit dispute state transition
      await expect(usdcEscrow.connect(owner).resolveDispute(0, 100))
        .to.emit(usdcEscrow, "DisputeResolved");

      const project = await usdcEscrow.projects(0);
      expect(project.state).to.equal(3); // ProjectState.Resolved
    });

    it("Should revert if non-owner tries to resolve dispute", async function () {
      const { usdcEscrow, client } = await loadFixture(activeProjectFixture);
      await expect(
        usdcEscrow.connect(client).resolveDispute(0, 50)
      ).to.be.revertedWithCustomError(usdcEscrow, "OwnableUnauthorizedAccount");
    });

    it("Should revert if clientSharePercent exceeds 100", async function () {
      const { usdcEscrow, owner } = await loadFixture(activeProjectFixture);
      await expect(
        usdcEscrow.connect(owner).resolveDispute(0, 101)
      ).to.be.revertedWith("USDCEscrow: Percentage cannot exceed 100");
    });

    it("Should revert if project is already resolved", async function () {
      const { usdcEscrow, owner } = await loadFixture(activeProjectFixture);
      await usdcEscrow.connect(owner).resolveDispute(0, 50);

      await expect(
        usdcEscrow.connect(owner).resolveDispute(0, 50)
      ).to.be.revertedWith("USDCEscrow: Project is not in a resolvable state");
    });
  });
});
