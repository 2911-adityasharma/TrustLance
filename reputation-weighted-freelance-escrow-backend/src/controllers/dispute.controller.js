import { Dispute, DisputeMessage, DisputeEvidence, AiRecommendation, User, Milestone, Project } from '../models/index.js';
import { postDisputeMessage, addDisputeEvidence, runHybridAnalysis } from '../services/dispute.service.js';
import { computeFileSha256 } from '../services/storage.service.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { DISPUTE_STATUS, DISPUTE_SENDER_TYPE, ROLES } from '../utils/constants.js';

export const completeClaim = asyncHandler(async (req, res) => {
  const { disputeId } = req.params;
  const { finalSummary } = req.body;

  const dispute = await Dispute.findByPk(disputeId);
  if (!dispute) {
    throw new ApiError(404, 'Dispute not found');
  }

  if (finalSummary) {
    await postDisputeMessage(disputeId, req.user, `Final Claim Summary: ${finalSummary}`);
  }

  dispute.status = DISPUTE_STATUS.WAITING_FOR_OTHER_PARTY;
  await dispute.save();

  return sendSuccess(res, 200, 'Dispute claim submitted. Waiting for second party response.', { dispute });
});

export const respondDispute = asyncHandler(async (req, res) => {
  const { disputeId } = req.params;
  const { responseContent } = req.body;

  const dispute = await Dispute.findByPk(disputeId);
  if (!dispute) {
    throw new ApiError(404, 'Dispute not found');
  }

  const message = await postDisputeMessage(disputeId, req.user, responseContent);
  dispute.status = DISPUTE_STATUS.ANALYZING;
  await dispute.save();

  return sendSuccess(res, 200, 'Dispute response recorded', { dispute, message });
});

export const uploadEvidence = asyncHandler(async (req, res) => {
  const { disputeId } = req.params;
  const { evidenceType, source, content } = req.body;

  let fileUrl = null;
  let fileHash = null;

  if (req.file) {
    fileUrl = `/uploads/${req.file.filename}`;
    fileHash = await computeFileSha256(req.file.path);
  }

  const evidence = await addDisputeEvidence(disputeId, req.user, {
    evidenceType: evidenceType || (req.file ? 'FILE' : 'TEXT'),
    source: source || 'USER_UPLOAD',
    content: content || '',
    fileUrl,
    fileHash,
    metadata: req.file
      ? { originalName: req.file.originalname, size: req.file.size, mimeType: req.file.mimetype }
      : {},
  });

  return sendSuccess(res, 201, 'Evidence submitted for dispute', { evidence });
});

export const analyzeDispute = asyncHandler(async (req, res) => {
  const { disputeId } = req.params;
  const recommendation = await runHybridAnalysis(disputeId);
  return sendSuccess(res, 200, 'Dispute hybrid analysis generated recommendation', { recommendation });
});

export const getDispute = asyncHandler(async (req, res) => {
  const { disputeId } = req.params;
  const dispute = await Dispute.findByPk(disputeId, {
    include: [
      { model: Project, as: 'project' },
      { model: Milestone, as: 'milestone' },
      { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
      { model: AiRecommendation, as: 'aiRecommendation' },
    ],
  });

  if (!dispute) {
    throw new ApiError(404, 'Dispute not found');
  }

  return sendSuccess(res, 200, 'Dispute details retrieved', { dispute });
});

export const getDisputeMessages = asyncHandler(async (req, res) => {
  const { disputeId } = req.params;
  const messages = await DisputeMessage.findAll({
    where: { disputeId },
    order: [['createdAt', 'ASC']],
    include: [{ model: User, as: 'sender', attributes: ['id', 'name', 'role'] }],
  });

  return sendSuccess(res, 200, 'Dispute messages retrieved', { messages });
});

export const getRecommendation = asyncHandler(async (req, res) => {
  const { disputeId } = req.params;
  const recommendation = await AiRecommendation.findOne({
    where: { disputeId },
  });

  if (!recommendation) {
    throw new ApiError(404, 'AI Recommendation not found for this dispute');
  }

  return sendSuccess(res, 200, 'AI Recommendation retrieved', { recommendation });
});

export const requestHumanReview = asyncHandler(async (req, res) => {
  const { disputeId } = req.params;
  const dispute = await Dispute.findByPk(disputeId);

  if (!dispute) {
    throw new ApiError(404, 'Dispute not found');
  }

  dispute.status = DISPUTE_STATUS.UNDER_HUMAN_REVIEW;
  await dispute.save();

  await DisputeMessage.create({
    disputeId,
    senderId: req.user.id,
    senderType: req.user.role === ROLES.ARBITRATOR ? DISPUTE_SENDER_TYPE.ARBITRATOR : (req.user.id === (await Project.findByPk(dispute.projectId)).clientId ? DISPUTE_SENDER_TYPE.CLIENT : DISPUTE_SENDER_TYPE.FREELANCER),
    content: 'Requested human arbitrator review for final settlement.',
  });

  return sendSuccess(res, 200, 'Dispute escalated to human arbitrator review', { dispute });
});
