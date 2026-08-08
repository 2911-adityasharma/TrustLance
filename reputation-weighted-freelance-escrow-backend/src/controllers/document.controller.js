import { ProjectDocument, DocumentApproval, User } from '../models/index.js';
import { createProjectDocument, submitDocumentForApproval, approveDocumentVersion, rejectDocumentVersion } from '../services/document.service.js';
import { generateProjectSpecification } from '../services/gemini.service.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

export const generateDocument = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { prompt, existingContent } = req.body;

  // Generate specification via Gemini
  const generatedContent = await generateProjectSpecification(prompt, existingContent);

  // Save as draft project document
  const document = await createProjectDocument(projectId, req.user.id, generatedContent);

  return sendSuccess(res, 201, 'AI generated project document draft', { document, generatedContent });
});

export const createDocument = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { content } = req.body;

  const document = await createProjectDocument(projectId, req.user.id, content);
  return sendSuccess(res, 201, 'Project document version created', { document });
});

export const getDocuments = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const documents = await ProjectDocument.findAll({
    where: { projectId },
    order: [['version', 'DESC']],
    include: [{ model: User, as: 'creator', attributes: ['id', 'name', 'email'] }],
  });

  return sendSuccess(res, 200, 'Project documents retrieved', { documents });
});

export const getDocumentByVersion = asyncHandler(async (req, res) => {
  const { projectId, version } = req.params;
  const document = await ProjectDocument.findOne({
    where: { projectId, version: parseInt(version, 10) },
    include: [
      {
        model: DocumentApproval,
        as: 'approvals',
        include: [{ model: User, as: 'user', attributes: ['id', 'name', 'role'] }],
      },
    ],
  });

  if (!document) {
    throw new ApiError(404, 'Project document version not found');
  }

  return sendSuccess(res, 200, 'Project document version retrieved', { document });
});

export const submitDocument = asyncHandler(async (req, res) => {
  const { projectId, version } = req.params;
  const document = await submitDocumentForApproval(projectId, parseInt(version, 10), req.user.id);
  return sendSuccess(res, 200, 'Document version submitted for dual approval', { document });
});

export const approveDocument = asyncHandler(async (req, res) => {
  const { projectId, version } = req.params;
  const { comment, walletSignature } = req.body;

  const result = await approveDocumentVersion(
    projectId,
    parseInt(version, 10),
    req.user,
    comment,
    walletSignature
  );

  return sendSuccess(
    res,
    200,
    result.approvedByBoth
      ? 'Document approved by both parties and set as active project specification'
      : 'Document approval registered. Pending approval from second party.',
    result
  );
});

export const rejectDocument = asyncHandler(async (req, res) => {
  const { projectId, version } = req.params;
  const { reason } = req.body;

  const document = await rejectDocumentVersion(projectId, parseInt(version, 10), req.user, reason);
  return sendSuccess(res, 200, 'Document version rejected', { document });
});
