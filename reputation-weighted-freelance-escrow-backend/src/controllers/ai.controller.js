import { startDisputeChat, postDisputeMessage } from '../services/dispute.service.js';
import { generateProjectSpecification } from '../services/gemini.service.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const generateDoc = asyncHandler(async (req, res) => {
  const { prompt, existingContent } = req.body;
  const spec = await generateProjectSpecification(prompt, existingContent);
  return sendSuccess(res, 200, 'Project specification generated', { specification: spec });
});

export const disputeAssistantStart = asyncHandler(async (req, res) => {
  const dispute = await startDisputeChat(req.user, req.body);
  return sendSuccess(res, 201, 'AI Dispute assistant started', { dispute });
});

export const disputeAssistantMessage = asyncHandler(async (req, res) => {
  const { disputeId } = req.params;
  const { content } = req.body;

  const message = await postDisputeMessage(disputeId, req.user, content);
  return sendSuccess(res, 200, 'Dispute message posted', { message });
});
