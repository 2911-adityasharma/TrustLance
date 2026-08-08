// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title USDCEscrow
 * @notice Freelance Escrow contract with on-chain reputation tracking and anti-ghosting dispute resolution.
 */
contract USDCEscrow is Ownable {
    using SafeERC20 for IERC20;

    enum ProjectState { Active, Completed, Disputed, Resolved }

    struct Project {
        address client;
        address freelancer;
        uint256 amount;
        ProjectState state;
    }

    IERC20 public immutable usdcToken;
    Project[] public projects;

    // Mapping to track on-chain reputation scores for clients and freelancers
    mapping(address => uint256) public reputation;

    // Events
    event ProjectCreated(
        uint256 indexed projectId,
        address indexed client,
        address indexed freelancer,
        uint256 amount
    );
    event FundsReleased(
        uint256 indexed projectId,
        address indexed freelancer,
        uint256 amount
    );
    event ProjectDisputed(
        uint256 indexed projectId,
        address indexed raisedBy
    );
    event DisputeResolved(
        uint256 indexed projectId,
        uint256 clientAmount,
        uint256 freelancerAmount
    );

    /**
     * @notice Constructor sets the USDC token address and the initial owner of the contract.
     * @param _usdcToken Address of the USDC ERC20 contract.
     */
    constructor(address _usdcToken) Ownable(msg.sender) {
        require(_usdcToken != address(0), "USDCEscrow: Token address cannot be zero");
        usdcToken = IERC20(_usdcToken);
    }

    /**
     * @notice Creates a new project, pulls USDC from the client, and initializes the escrow.
     * @param freelancer Address of the freelancer.
     * @param amount Amount of USDC locked in escrow.
     * @return projectId The ID of the newly created project.
     */
    function createProject(address freelancer, uint256 amount) external returns (uint256) {
        require(freelancer != address(0), "USDCEscrow: Freelancer address cannot be zero");
        require(freelancer != msg.sender, "USDCEscrow: Client and freelancer cannot be the same address");
        require(amount > 0, "USDCEscrow: Amount must be greater than zero");

        uint256 projectId = projects.length;
        projects.push(Project({
            client: msg.sender,
            freelancer: freelancer,
            amount: amount,
            state: ProjectState.Active
        }));

        // Interaction: Pull USDC from the client
        usdcToken.safeTransferFrom(msg.sender, address(this), amount);

        emit ProjectCreated(projectId, msg.sender, freelancer, amount);
        return projectId;
    }

    /**
     * @notice Allows the client to release 100% of the locked USDC to the freelancer upon completion.
     * @dev Increments both parties' reputation score.
     * @param projectId The ID of the project.
     */
    function releaseFunds(uint256 projectId) external {
        require(projectId < projects.length, "USDCEscrow: Project does not exist");
        Project storage project = projects[projectId];

        require(msg.sender == project.client, "USDCEscrow: Only the client can release funds");
        require(project.state == ProjectState.Active, "USDCEscrow: Project is not active");

        // Effect: update state and reputation
        project.state = ProjectState.Completed;
        reputation[project.client] += 1;
        reputation[project.freelancer] += 1;

        // Interaction: transfer funds
        usdcToken.safeTransfer(project.freelancer, project.amount);

        emit FundsReleased(projectId, project.freelancer, project.amount);
    }

    /**
     * @notice Allows the client or freelancer to flag a project as disputed if a ghosting or quality issue occurs.
     * @param projectId The ID of the project.
     */
    function disputeProject(uint256 projectId) external {
        require(projectId < projects.length, "USDCEscrow: Project does not exist");
        Project storage project = projects[projectId];

        require(
            msg.sender == project.client || msg.sender == project.freelancer,
            "USDCEscrow: Only client or freelancer can dispute"
        );
        require(project.state == ProjectState.Active, "USDCEscrow: Project is not active");

        project.state = ProjectState.Disputed;

        emit ProjectDisputed(projectId, msg.sender);
    }

    /**
     * @notice Resolves a disputed or active project, splitting funds between client and freelancer.
     * @dev Only callable by the contract owner (representing the backend mediator).
     * @param projectId The ID of the project.
     * @param clientSharePercent The percentage (0-100) of the funds to return to the client.
     */
    function resolveDispute(uint256 projectId, uint8 clientSharePercent) external onlyOwner {
        require(projectId < projects.length, "USDCEscrow: Project does not exist");
        Project storage project = projects[projectId];

        require(
            project.state == ProjectState.Active || project.state == ProjectState.Disputed,
            "USDCEscrow: Project is not in a resolvable state"
        );
        require(clientSharePercent <= 100, "USDCEscrow: Percentage cannot exceed 100");

        uint256 clientAmount = (project.amount * clientSharePercent) / 100;
        uint256 freelancerAmount = project.amount - clientAmount;

        // Effect: Update state and reputation
        project.state = ProjectState.Resolved;
        reputation[project.client] += 1;
        reputation[project.freelancer] += 1;

        // Interaction: Distribute split funds
        if (clientAmount > 0) {
            usdcToken.safeTransfer(project.client, clientAmount);
        }
        if (freelancerAmount > 0) {
            usdcToken.safeTransfer(project.freelancer, freelancerAmount);
        }

        emit DisputeResolved(projectId, clientAmount, freelancerAmount);
    }

    /**
     * @notice Helper function to get the total number of projects.
     */
    function getProjectsCount() external view returns (uint256) {
        return projects.length;
    }
}
