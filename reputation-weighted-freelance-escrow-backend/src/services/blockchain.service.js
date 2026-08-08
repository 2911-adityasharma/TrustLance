import { config } from '../config/env.js';

export const isBlockchainConfigured = () => {
  return Boolean(config.blockchain.rpcUrl && config.blockchain.escrowContractAddress);
};

export const anchorDocumentHash = async (projectId, documentVersion, documentHash) => {
  if (!isBlockchainConfigured()) {
    return {
      success: false,
      configured: false,
      message: 'Blockchain service is not configured',
    };
  }
  // Stub implementation for when RPC URL is configured in future
  return {
    success: true,
    configured: true,
    txHash: '0x' + Array(64).fill('0').join(''),
    projectId,
    documentVersion,
    documentHash,
  };
};

export const recordEvidenceHash = async (disputeId, evidenceId, fileHash) => {
  if (!isBlockchainConfigured()) {
    return {
      success: false,
      configured: false,
      message: 'Blockchain service is not configured',
    };
  }
  return {
    success: true,
    configured: true,
    txHash: '0x' + Array(64).fill('0').join(''),
    disputeId,
    evidenceId,
    fileHash,
  };
};

export const submitResolution = async (disputeId, decision, freelancerPercentage, clientRefundPercentage) => {
  if (!isBlockchainConfigured()) {
    return {
      success: false,
      configured: false,
      message: 'Blockchain service is not configured',
    };
  }
  return {
    success: true,
    configured: true,
    txHash: '0x' + Array(64).fill('0').join(''),
    disputeId,
    decision,
    freelancerPercentage,
    clientRefundPercentage,
  };
};

export const recordReputationEvent = async (userId, eventType, scoreChange, transactionHash) => {
  if (!isBlockchainConfigured()) {
    return {
      success: false,
      configured: false,
      message: 'Blockchain service is not configured',
    };
  }
  return {
    success: true,
    configured: true,
    txHash: transactionHash || ('0x' + Array(64).fill('0').join('')),
    userId,
    eventType,
    scoreChange,
  };
};
