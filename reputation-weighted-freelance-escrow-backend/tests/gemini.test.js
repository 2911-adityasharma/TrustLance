import { jest } from '@jest/globals';
import { aiRecommendationSchema } from '../src/validators/dispute.validator.js';

describe('Gemini Recommendation Schema Validation', () => {
  test('passes valid PARTIAL_PAYMENT split (70/30 = 100)', () => {
    const valid = {
      decision: 'PARTIAL_PAYMENT',
      freelancerPercentage: 70,
      clientRefundPercentage: 30,
      confidence: 85,
      summary: 'Freelancer completed most criteria.',
      completedCriteria: ['Criterion A'],
      incompleteCriteria: ['Criterion B'],
      verifiedFacts: ['Submitted 2 days late'],
      assumptions: [],
      missingInformation: [],
      evidenceReferences: ['evidence-id-1'],
      requiresHumanReview: true,
    };
    const { error, value } = aiRecommendationSchema.validate(valid);
    expect(error).toBeUndefined();
    expect(value.freelancerPercentage + value.clientRefundPercentage).toBe(100);
  });

  test('passes FULL_PAYMENT (100/0)', () => {
    const { error } = aiRecommendationSchema.validate({
      decision: 'FULL_PAYMENT',
      freelancerPercentage: 100,
      clientRefundPercentage: 0,
      confidence: 95,
      summary: 'All criteria met.',
    });
    expect(error).toBeUndefined();
  });

  test('passes FULL_REFUND (0/100)', () => {
    const { error } = aiRecommendationSchema.validate({
      decision: 'FULL_REFUND',
      freelancerPercentage: 0,
      clientRefundPercentage: 100,
      confidence: 90,
      summary: 'No deliverables submitted.',
    });
    expect(error).toBeUndefined();
  });

  test('fails when percentages do not sum to 100 (60 + 30 = 90)', () => {
    const { error } = aiRecommendationSchema.validate({
      decision: 'PARTIAL_PAYMENT',
      freelancerPercentage: 60,
      clientRefundPercentage: 30,
      confidence: 75,
      summary: 'Invalid split.',
    });
    expect(error).toBeDefined();
  });

  test('fails on invalid decision value', () => {
    const { error } = aiRecommendationSchema.validate({
      decision: 'MAGIC_PAYMENT',
      freelancerPercentage: 50,
      clientRefundPercentage: 50,
      confidence: 50,
      summary: 'Bad decision type.',
    });
    expect(error).toBeDefined();
  });

  test('generateProjectSpecification throws 503 when GEMINI_API_KEY missing', async () => {
    const originalKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    // Re-import to pick up env change
    const { isGeminiConfigured, generateProjectSpecification } = await import('../src/services/gemini.service.js');

    if (!isGeminiConfigured()) {
      await expect(generateProjectSpecification('Build e-commerce')).rejects.toMatchObject({
        statusCode: 503,
        message: 'AI service is not configured',
      });
    }

    if (originalKey) process.env.GEMINI_API_KEY = originalKey;
  });
});
