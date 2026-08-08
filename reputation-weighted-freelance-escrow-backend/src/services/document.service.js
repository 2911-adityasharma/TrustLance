import { sequelize, Project, ProjectDocument, DocumentApproval } from '../models/index.js';
import { hashCanonicalJson } from './hash.service.js';
import { DOCUMENT_STATUS, APPROVAL_DECISION, PROJECT_STATUS } from '../utils/constants.js';
import { ApiError } from '../utils/ApiError.js';
import { createNotification } from './notification.service.js';

export const createProjectDocument = async (projectId, userId, content) => {
  return sequelize.transaction(async (t) => {
    const project = await Project.findByPk(projectId, { transaction: t });
    if (!project) {
      throw new ApiError(404, 'Project not found');
    }

    // Find latest document version
    const latestDoc = await ProjectDocument.findOne({
      where: { projectId },
      order: [['version', 'DESC']],
      transaction: t,
    });

    const nextVersion = latestDoc ? latestDoc.version + 1 : 1;
    const contentHash = hashCanonicalJson(content);

    const document = await ProjectDocument.create(
      {
        projectId,
        version: nextVersion,
        content,
        contentHash,
        status: DOCUMENT_STATUS.DRAFT,
        createdBy: userId,
      },
      { transaction: t }
    );

    return document;
  });
};

export const submitDocumentForApproval = async (projectId, version, userId) => {
  const document = await ProjectDocument.findOne({
    where: { projectId, version },
  });

  if (!document) {
    throw new ApiError(404, 'Project document version not found');
  }

  if (document.status === DOCUMENT_STATUS.APPROVED) {
    throw new ApiError(400, 'Approved documents are immutable and cannot be resubmitted');
  }

  document.status = DOCUMENT_STATUS.PENDING_APPROVAL;
  await document.save();

  return document;
};

export const approveDocumentVersion = async (projectId, version, user, comment = '', walletSignature = '') => {
  return sequelize.transaction(async (t) => {
    const project = await Project.findByPk(projectId, { transaction: t });
    if (!project) {
      throw new ApiError(404, 'Project not found');
    }

    const document = await ProjectDocument.findOne({
      where: { projectId, version },
      transaction: t,
    });

    if (!document) {
      throw new ApiError(404, 'Project document version not found');
    }

    if (document.status === DOCUMENT_STATUS.APPROVED) {
      throw new ApiError(400, 'Document version is already approved');
    }

    // Upsert user approval decision
    const existingApproval = await DocumentApproval.findOne({
      where: { projectDocumentId: document.id, userId: user.id },
      transaction: t,
    });

    if (existingApproval) {
      existingApproval.decision = APPROVAL_DECISION.APPROVED;
      existingApproval.comment = comment;
      existingApproval.walletSignature = walletSignature;
      existingApproval.approvedAt = new Date();
      await existingApproval.save({ transaction: t });
    } else {
      await DocumentApproval.create(
        {
          projectDocumentId: document.id,
          userId: user.id,
          decision: APPROVAL_DECISION.APPROVED,
          comment,
          walletSignature,
          approvedAt: new Date(),
        },
        { transaction: t }
      );
    }

    // Check if both Client and Freelancer have approved
    const approvals = await DocumentApproval.findAll({
      where: {
        projectDocumentId: document.id,
        decision: APPROVAL_DECISION.APPROVED,
      },
      transaction: t,
    });

    const approvedUserIds = new Set(approvals.map((a) => a.userId));
    const hasClientApproved = approvedUserIds.has(project.clientId);
    const hasFreelancerApproved = project.freelancerId ? approvedUserIds.has(project.freelancerId) : true;

    if (hasClientApproved && hasFreelancerApproved) {
      // Mark previous approved documents as SUPERSEDED
      await ProjectDocument.update(
        { status: DOCUMENT_STATUS.SUPERSEDED },
        { where: { projectId, status: DOCUMENT_STATUS.APPROVED }, transaction: t }
      );

      // Lock current document
      document.status = DOCUMENT_STATUS.APPROVED;
      document.lockedAt = new Date();
      await document.save({ transaction: t });

      // Set active document version and update project status
      project.activeDocumentVersion = document.version;
      if (project.status === PROJECT_STATUS.DRAFT || project.status === PROJECT_STATUS.PENDING_FREELANCER) {
        project.status = PROJECT_STATUS.ACTIVE;
        if (!project.startDate) {
          project.startDate = new Date();
        }
      }
      await project.save({ transaction: t });

      // Notify users
      await createNotification({
        userId: project.clientId,
        projectId,
        type: 'APPROVAL',
        title: 'Document Approved',
        message: `Project document version ${version} has been approved by both parties and is now active.`,
      });

      if (project.freelancerId) {
        await createNotification({
          userId: project.freelancerId,
          projectId,
          type: 'APPROVAL',
          title: 'Document Approved',
          message: `Project document version ${version} has been approved by both parties and is now active.`,
        });
      }
    } else {
      document.status = DOCUMENT_STATUS.PENDING_APPROVAL;
      await document.save({ transaction: t });
    }

    return { document, approvedByBoth: document.status === DOCUMENT_STATUS.APPROVED };
  });
};

export const rejectDocumentVersion = async (projectId, version, user, reason) => {
  const document = await ProjectDocument.findOne({ where: { projectId, version } });
  if (!document) {
    throw new ApiError(404, 'Project document version not found');
  }

  if (document.status === DOCUMENT_STATUS.APPROVED) {
    throw new ApiError(400, 'Approved document versions cannot be rejected');
  }

  await DocumentApproval.upsert({
    projectDocumentId: document.id,
    userId: user.id,
    decision: APPROVAL_DECISION.REJECTED,
    comment: reason,
  });

  document.status = DOCUMENT_STATUS.REJECTED;
  await document.save();

  return document;
};
