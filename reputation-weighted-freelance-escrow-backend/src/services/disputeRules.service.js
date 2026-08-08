import { Milestone, ChangeRequest, ProjectDocument, DisputeMessage } from '../models/index.js';
import { MILESTONE_STATUS, DOCUMENT_STATUS, DISPUTE_SENDER_TYPE } from '../utils/constants.js';

export const evaluateDisputeFacts = async (dispute, milestone, project) => {
  const verifiedFacts = [];
  const deterministicAnalysis = {};

  // 1. Milestone Funded Status
  const isFunded = [MILESTONE_STATUS.FUNDED, MILESTONE_STATUS.IN_PROGRESS, MILESTONE_STATUS.SUBMITTED, MILESTONE_STATUS.REVISION_REQUESTED, MILESTONE_STATUS.APPROVED, MILESTONE_STATUS.DISPUTED].includes(milestone.status);
  deterministicAnalysis.isFunded = isFunded;
  verifiedFacts.push(`Milestone funded status: ${isFunded ? 'FUNDED' : 'UNFUNDED'}`);

  // 2. Submission Existence and Timestamps
  const hasSubmission = Boolean(milestone.submissionUrl || milestone.submissionHash || milestone.submittedAt);
  deterministicAnalysis.hasSubmission = hasSubmission;
  verifiedFacts.push(`Deliverable submission exists: ${hasSubmission ? 'YES' : 'NO'}`);

  if (milestone.submittedAt) {
    verifiedFacts.push(`Deliverable submitted at: ${new Date(milestone.submittedAt).toISOString()}`);
  }

  // 3. Approved Deadline and Overdue calculation
  if (milestone.dueDate) {
    const dueTime = new Date(milestone.dueDate).getTime();
    verifiedFacts.push(`Approved milestone due date: ${new Date(milestone.dueDate).toISOString()}`);

    if (milestone.submittedAt) {
      const subTime = new Date(milestone.submittedAt).getTime();
      const isLate = subTime > dueTime;
      deterministicAnalysis.isLateDelivery = isLate;
      verifiedFacts.push(`Delivery timeliness: ${isLate ? 'LATE DELIVERY' : 'ON TIME'}`);
    } else {
      const isOverdueNow = Date.now() > dueTime;
      deterministicAnalysis.isOverdueNow = isOverdueNow;
      if (isOverdueNow) {
        verifiedFacts.push(`Milestone status: OVERDUE (due date passed without submission)`);
      }
    }
  }

  // 4. Review Deadline Expiry
  if (milestone.reviewDeadline) {
    const isReviewExpired = Date.now() > new Date(milestone.reviewDeadline).getTime();
    deterministicAnalysis.isReviewExpired = isReviewExpired;
    verifiedFacts.push(`Client review deadline: ${new Date(milestone.reviewDeadline).toISOString()} (${isReviewExpired ? 'EXPIRED' : 'ACTIVE'})`);
  }

  // 5. Approved Change Requests & Deadline Extensions
  const approvedChangeRequests = await ChangeRequest.findAll({
    where: { projectId: project.id, status: 'APPROVED' },
  });

  const totalDaysExtension = approvedChangeRequests.reduce((acc, cr) => acc + (cr.deadlineImpact || 0), 0);
  const totalPaymentAdjustment = approvedChangeRequests.reduce((acc, cr) => acc + (parseFloat(cr.paymentImpact) || 0), 0);

  deterministicAnalysis.totalDaysExtension = totalDaysExtension;
  deterministicAnalysis.totalPaymentAdjustment = totalPaymentAdjustment;
  verifiedFacts.push(`Approved change requests: ${approvedChangeRequests.length} (Total deadline impact: ${totalDaysExtension} days)`);

  // 6. Active Approved Document Version Check
  const activeDocument = await ProjectDocument.findOne({
    where: { projectId: project.id, version: project.activeDocumentVersion || 1, status: DOCUMENT_STATUS.APPROVED },
  });

  deterministicAnalysis.hasActiveDocument = Boolean(activeDocument);
  if (activeDocument) {
    verifiedFacts.push(`Active approved contract document version: v${activeDocument.version} (Hash: ${activeDocument.contentHash})`);
  }

  // 7. Check for Missing Party Responses in Dispute Chat
  const clientMessages = await DisputeMessage.count({
    where: { disputeId: dispute.id, senderType: DISPUTE_SENDER_TYPE.CLIENT },
  });
  const freelancerMessages = await DisputeMessage.count({
    where: { disputeId: dispute.id, senderType: DISPUTE_SENDER_TYPE.FREELANCER },
  });

  deterministicAnalysis.clientMessageCount = clientMessages;
  deterministicAnalysis.freelancerMessageCount = freelancerMessages;

  if (clientMessages === 0) {
    verifiedFacts.push('Client has not responded to the dispute chat.');
  }
  if (freelancerMessages === 0) {
    verifiedFacts.push('Freelancer has not responded to the dispute chat.');
  }

  return { verifiedFacts, deterministicAnalysis, activeDocument };
};
