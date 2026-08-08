import { sequelize, Dispute, DisputeMessage, DisputeEvidence, AiRecommendation, Project, Milestone, User } from '../models/index.js';
import { DISPUTE_STATUS, DISPUTE_SENDER_TYPE, DEFAULT_RESPONSE_DEADLINE_DAYS, PROJECT_STATUS, MILESTONE_STATUS } from '../utils/constants.js';
import { ApiError } from '../utils/ApiError.js';
import { evaluateDisputeFacts } from './disputeRules.service.js';
import { analyzeDisputeWithGemini } from './gemini.service.js';
import { createNotification } from './notification.service.js';

export const startDisputeChat = async (user, { projectId, milestoneId, category, initialClaim }) => {
  return sequelize.transaction(async (t) => {
    const project = await Project.findByPk(projectId, { transaction: t });
    if (!project) {
      throw new ApiError(404, 'Project not found');
    }

    const milestone = await Milestone.findByPk(milestoneId, { transaction: t });
    if (!milestone) {
      throw new ApiError(404, 'Milestone not found');
    }

    // Set deadline for other party to respond
    const responseDeadline = new Date();
    responseDeadline.setDate(responseDeadline.getDate() + DEFAULT_RESPONSE_DEADLINE_DAYS);

    const dispute = await Dispute.create(
      {
        projectId,
        milestoneId,
        raisedBy: user.id,
        category,
        initialClaim,
        status: DISPUTE_STATUS.WAITING_FOR_OTHER_PARTY,
        responseDeadline,
      },
      { transaction: t }
    );

    // Update project and milestone statuses
    project.status = PROJECT_STATUS.IN_DISPUTE;
    await project.save({ transaction: t });

    milestone.status = MILESTONE_STATUS.DISPUTED;
    await milestone.save({ transaction: t });

    // Store initial claim message
    const senderType = user.id === project.clientId ? DISPUTE_SENDER_TYPE.CLIENT : DISPUTE_SENDER_TYPE.FREELANCER;
    await DisputeMessage.create(
      {
        disputeId: dispute.id,
        senderId: user.id,
        senderType,
        content: `Dispute raised: ${initialClaim}`,
      },
      { transaction: t }
    );

    // Initial AI greeting message
    await DisputeMessage.create(
      {
        disputeId: dispute.id,
        senderId: null,
        senderType: DISPUTE_SENDER_TYPE.AI,
        content: `A dispute has been initiated regarding milestone "${milestone.title}". Both parties have ${DEFAULT_RESPONSE_DEADLINE_DAYS} days to provide claims and evidence.`,
      },
      { transaction: t }
    );

    // Send notifications
    const otherUserId = user.id === project.clientId ? project.freelancerId : project.clientId;
    if (otherUserId) {
      await createNotification({
        userId: otherUserId,
        projectId,
        disputeId: dispute.id,
        type: 'DISPUTE_ALERT',
        title: 'Dispute Raised',
        message: `A dispute has been raised on project "${project.title}". Please respond before ${responseDeadline.toISOString()}.`,
      });
    }

    return dispute;
  });
};

export const postDisputeMessage = async (disputeId, user, content) => {
  const dispute = await Dispute.findByPk(disputeId);
  if (!dispute) {
    throw new ApiError(404, 'Dispute not found');
  }

  const project = await Project.findByPk(dispute.projectId);
  const senderType = user.id === project.clientId ? DISPUTE_SENDER_TYPE.CLIENT : (user.id === project.freelancerId ? DISPUTE_SENDER_TYPE.FREELANCER : DISPUTE_SENDER_TYPE.ARBITRATOR);

  const message = await DisputeMessage.create({
    disputeId,
    senderId: user.id,
    senderType,
    content,
  });

  return message;
};

export const addDisputeEvidence = async (disputeId, user, { evidenceType, source, content, fileUrl, fileHash, metadata }) => {
  const dispute = await Dispute.findByPk(disputeId);
  if (!dispute) {
    throw new ApiError(404, 'Dispute not found');
  }

  const evidence = await DisputeEvidence.create({
    disputeId,
    submittedBy: user.id,
    evidenceType,
    source,
    content,
    fileUrl,
    fileHash,
    authenticityStatus: 'UNVERIFIED',
    metadata,
  });

  return evidence;
};

export const runHybridAnalysis = async (disputeId) => {
  const dispute = await Dispute.findByPk(disputeId);
  if (!dispute) {
    throw new ApiError(404, 'Dispute not found');
  }

  const project = await Project.findByPk(dispute.projectId);
  const milestone = await Milestone.findByPk(dispute.milestoneId);
  const messages = await DisputeMessage.findAll({ where: { disputeId }, order: [['createdAt', 'ASC']] });
  const evidences = await DisputeEvidence.findAll({ where: { disputeId } });

  // 1. Run deterministic rule evaluation engine
  const { verifiedFacts, deterministicAnalysis, activeDocument } = await evaluateDisputeFacts(dispute, milestone, project);

  // 2. Run Gemini conflict resolution analysis
  const aiResult = await analyzeDisputeWithGemini({
    dispute,
    project,
    milestone,
    activeDocument,
    verifiedFacts,
    deterministicAnalysis,
    messages,
    evidences,
  });

  // Combine deterministic verified facts with AI output
  const finalVerifiedFacts = Array.from(new Set([...verifiedFacts, ...(aiResult.verifiedFacts || [])]));

  const recommendation = await AiRecommendation.create({
    disputeId: dispute.id,
    decision: aiResult.decision,
    freelancerPercentage: aiResult.freelancerPercentage,
    clientRefundPercentage: aiResult.clientRefundPercentage,
    confidence: aiResult.confidence,
    summary: aiResult.summary,
    completedCriteria: aiResult.completedCriteria || [],
    incompleteCriteria: aiResult.incompleteCriteria || [],
    verifiedFacts: finalVerifiedFacts,
    assumptions: aiResult.assumptions || [],
    missingInformation: aiResult.missingInformation || [],
    evidenceReferences: aiResult.evidenceReferences || [],
    requiresHumanReview: true,
    modelName: 'gemini-2.5-flash',
    promptVersion: '1.0',
  });

  dispute.status = DISPUTE_STATUS.RECOMMENDATION_READY;
  await dispute.save();

  // Create system message in dispute chat
  await DisputeMessage.create({
    disputeId: dispute.id,
    senderId: null,
    senderType: DISPUTE_SENDER_TYPE.SYSTEM,
    content: `AI conflict analysis complete. Recommended decision: ${aiResult.decision} (${aiResult.freelancerPercentage}% Freelancer / ${aiResult.clientRefundPercentage}% Client Refund). Requires human review.`,
  });

  return recommendation;
};
