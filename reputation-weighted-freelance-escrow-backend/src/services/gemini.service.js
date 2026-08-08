import { GoogleGenAI } from '@google/genai';
import { config } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { DOCUMENTATION_SYSTEM_PROMPT } from '../prompts/documentation.prompt.js';
import { DISPUTE_ANALYSIS_SYSTEM_PROMPT } from '../prompts/dispute.prompt.js';
import { aiRecommendationSchema } from '../validators/dispute.validator.js';

export const isGeminiConfigured = () => {
  return Boolean(config.gemini.apiKey && config.gemini.apiKey.trim().length > 0);
};

let genAiInstance = null;

const getGenAiClient = () => {
  if (!isGeminiConfigured()) {
    throw new ApiError(503, 'AI service is not configured');
  }
  if (!genAiInstance) {
    genAiInstance = new GoogleGenAI({ apiKey: config.gemini.apiKey });
  }
  return genAiInstance;
};

/**
 * Sanitizes JSON response string from Gemini (strips ```json ... ``` markdown block if present)
 */
const cleanJsonResponse = (text) => {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  return cleaned.trim();
};

/**
 * Documentation Assistant: Generates structured project specification from natural language description
 */
export const generateProjectSpecification = async (userPrompt, existingContent = null) => {
  const ai = getGenAiClient();

  const promptContent = `
${DOCUMENTATION_SYSTEM_PROMPT}

USER PROJECT DESCRIPTION:
${userPrompt}

EXISTING DRAFT CONTENT (if any):
${existingContent ? JSON.stringify(existingContent, null, 2) : 'None'}
`;

  const response = await ai.models.generateContent({
    model: config.gemini.model || 'gemini-2.5-flash',
    contents: promptContent,
  });

  const rawText = response.text;
  const jsonText = cleanJsonResponse(rawText);

  try {
    const parsed = JSON.parse(jsonText);
    return parsed;
  } catch (err) {
    throw new ApiError(500, 'Failed to parse AI-generated project document specification JSON', [err.message]);
  }
};

/**
 * Dispute Analysis Assistant: Generates conflict resolution recommendation from contract facts & claims
 */
export const analyzeDisputeWithGemini = async (contextData) => {
  const ai = getGenAiClient();

  // Sanitize input data (exclude user tokens, passwords, wallet private keys)
  const sanitizedContext = {
    projectTitle: contextData.project.title,
    projectDescription: contextData.project.description,
    approvedContractDocument: contextData.activeDocument ? contextData.activeDocument.content : null,
    milestone: {
      title: contextData.milestone.title,
      description: contextData.milestone.description,
      acceptanceCriteria: contextData.milestone.acceptanceCriteria,
      amount: contextData.milestone.amount,
      dueDate: contextData.milestone.dueDate,
      reviewDeadline: contextData.milestone.reviewDeadline,
      submissionUrl: contextData.milestone.submissionUrl,
      submittedAt: contextData.milestone.submittedAt,
    },
    verifiedFacts: contextData.verifiedFacts,
    deterministicAnalysis: contextData.deterministicAnalysis,
    disputeCategory: contextData.dispute.category,
    initialClaim: contextData.dispute.initialClaim,
    disputeMessages: contextData.messages.map((m) => ({
      senderType: m.senderType,
      content: m.content,
      createdAt: m.createdAt,
    })),
    evidences: contextData.evidences.map((e) => ({
      id: e.id,
      evidenceType: e.evidenceType,
      source: e.source,
      content: e.content,
      authenticityStatus: e.authenticityStatus,
    })),
  };

  const promptContent = `
${DISPUTE_ANALYSIS_SYSTEM_PROMPT}

DISPUTE CONTEXT & DETERMINISTIC FACTS:
${JSON.stringify(sanitizedContext, null, 2)}
`;

  const response = await ai.models.generateContent({
    model: config.gemini.model || 'gemini-2.5-flash',
    contents: promptContent,
  });

  const rawText = response.text;
  const jsonText = cleanJsonResponse(rawText);

  let parsedRecommendation;
  try {
    parsedRecommendation = JSON.parse(jsonText);
  } catch (err) {
    throw new ApiError(500, 'Failed to parse AI dispute recommendation response JSON', [err.message]);
  }

  // Validate with Joi
  const { error, value } = aiRecommendationSchema.validate(parsedRecommendation);
  if (error) {
    throw new ApiError(422, `AI recommendation schema validation failed: ${error.message}`, error.details);
  }

  return value;
};
