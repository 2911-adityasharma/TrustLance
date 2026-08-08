import { Milestone, ChangeRequest, Project, ProjectDocument, sequelize } from '../models/index.js';
import { MILESTONE_STATUS, CHANGE_REQUEST_STATUS, DOCUMENT_STATUS } from '../utils/constants.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { createProjectDocument } from '../services/document.service.js';
import { generateSha256 } from '../services/hash.service.js';

export const createMilestone = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { title, description, acceptanceCriteria, amount, sequence, dueDate } = req.body;

  const milestone = await Milestone.create({
    projectId,
    title,
    description,
    acceptanceCriteria: acceptanceCriteria || [],
    amount,
    sequence: sequence || 1,
    dueDate: dueDate || null,
    status: MILESTONE_STATUS.FUNDED,
  });

  return sendSuccess(res, 201, 'Milestone created and funded', { milestone });
});

export const getMilestones = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const milestones = await Milestone.findAll({
    where: { projectId },
    order: [['sequence', 'ASC']],
  });

  return sendSuccess(res, 200, 'Project milestones retrieved', { milestones });
});

export const submitMilestone = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { submissionUrl, notes } = req.body;

  const milestone = await Milestone.findByPk(id);
  if (!milestone) {
    throw new ApiError(404, 'Milestone not found');
  }

  const submissionHash = generateSha256(`${submissionUrl || ''}:${notes || ''}:${Date.now()}`);

  milestone.submissionUrl = submissionUrl;
  milestone.submissionHash = submissionHash;
  milestone.submittedAt = new Date();
  milestone.status = MILESTONE_STATUS.SUBMITTED;

  // Set review deadline to 3 days from now
  const reviewDeadline = new Date();
  reviewDeadline.setDate(reviewDeadline.getDate() + 3);
  milestone.reviewDeadline = reviewDeadline;

  await milestone.save();
  return sendSuccess(res, 200, 'Milestone deliverable submitted for client review', { milestone });
});

export const approveMilestone = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const milestone = await Milestone.findByPk(id);

  if (!milestone) {
    throw new ApiError(404, 'Milestone not found');
  }

  milestone.status = MILESTONE_STATUS.APPROVED;
  milestone.approvedAt = new Date();
  await milestone.save();

  return sendSuccess(res, 200, 'Milestone deliverable approved', { milestone });
});

export const requestRevision = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const milestone = await Milestone.findByPk(id);
  if (!milestone) {
    throw new ApiError(404, 'Milestone not found');
  }

  milestone.status = MILESTONE_STATUS.REVISION_REQUESTED;
  await milestone.save();

  return sendSuccess(res, 200, 'Revision requested for milestone', { milestone, reason });
});

export const createChangeRequest = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { milestoneId, description, proposedChanges, paymentImpact, deadlineImpact } = req.body;

  const changeRequest = await ChangeRequest.create({
    projectId,
    milestoneId: milestoneId || null,
    requestedBy: req.user.id,
    description,
    proposedChanges,
    paymentImpact: paymentImpact || 0,
    deadlineImpact: deadlineImpact || 0,
    status: CHANGE_REQUEST_STATUS.PENDING,
    approvedByClient: req.user.id === (await Project.findByPk(projectId)).clientId,
    approvedByFreelancer: req.user.id === (await Project.findByPk(projectId)).freelancerId,
  });

  return sendSuccess(res, 201, 'Change request created', { changeRequest });
});

export const respondChangeRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { approve } = req.body;

  return sequelize.transaction(async (t) => {
    const changeRequest = await ChangeRequest.findByPk(id, { transaction: t });
    if (!changeRequest) {
      throw new ApiError(404, 'Change request not found');
    }

    const project = await Project.findByPk(changeRequest.projectId, { transaction: t });

    if (!approve) {
      changeRequest.status = CHANGE_REQUEST_STATUS.REJECTED;
      await changeRequest.save({ transaction: t });
      return sendSuccess(res, 200, 'Change request rejected', { changeRequest });
    }

    if (req.user.id === project.clientId) {
      changeRequest.approvedByClient = true;
    }
    if (req.user.id === project.freelancerId) {
      changeRequest.approvedByFreelancer = true;
    }

    if (changeRequest.approvedByClient && changeRequest.approvedByFreelancer) {
      changeRequest.status = CHANGE_REQUEST_STATUS.APPROVED;
      await changeRequest.save({ transaction: t });

      // Get current active document and clone it with proposed changes for new version
      const activeDoc = await ProjectDocument.findOne({
        where: { projectId: project.id, version: project.activeDocumentVersion || 1 },
        transaction: t,
      });

      const previousContent = activeDoc ? activeDoc.content : {};
      const newContent = {
        ...previousContent,
        lastChangeRequest: {
          id: changeRequest.id,
          description: changeRequest.description,
          proposedChanges: changeRequest.proposedChanges,
        },
      };

      // Create new draft document version from change request
      const newDoc = await createProjectDocument(project.id, req.user.id, newContent);

      return sendSuccess(res, 200, 'Change request accepted by both parties. New document version created.', {
        changeRequest,
        newDocumentVersion: newDoc.version,
      });
    }

    await changeRequest.save({ transaction: t });
    return sendSuccess(res, 200, 'Change request response recorded. Pending second party approval.', { changeRequest });
  });
});
