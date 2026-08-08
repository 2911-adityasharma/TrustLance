import { jest } from '@jest/globals';

// Mock models before any imports
jest.unstable_mockModule('../src/models/index.js', () => ({
  sequelize: { authenticate: jest.fn(), transaction: jest.fn((fn) => fn({})) },
  ChangeRequest: { findAll: jest.fn() },
  ProjectDocument: { findOne: jest.fn() },
  DisputeMessage: { count: jest.fn() },
  User: { findByPk: jest.fn(), findOne: jest.fn() },
  Project: { findByPk: jest.fn() },
  Milestone: {},
  ProjectMessage: {},
  Dispute: {},
  DisputeEvidence: {},
  AiRecommendation: {},
  Notification: {},
  ReputationEvent: {},
  DocumentApproval: {},
}));

const { ChangeRequest, ProjectDocument, DisputeMessage } = await import('../src/models/index.js');
const { evaluateDisputeFacts } = await import('../src/services/disputeRules.service.js');

describe('Deterministic Dispute Rules Evaluation', () => {
  beforeEach(() => {
    ChangeRequest.findAll.mockResolvedValue([
      { paymentImpact: '200.00', deadlineImpact: 5 },
    ]);
    ProjectDocument.findOne.mockResolvedValue({
      version: 1,
      contentHash: 'hash123',
    });
    DisputeMessage.count.mockImplementation(async ({ where }) => {
      if (where.senderType === 'CLIENT') return 1;
      if (where.senderType === 'FREELANCER') return 0;
      return 0;
    });
  });

  test('Flags LATE DELIVERY when submission is after dueDate', async () => {
    const mockDispute = { id: 'disp-1' };
    const mockMilestone = {
      title: 'Milestone 1',
      description: 'API integration',
      amount: 500,
      status: 'SUBMITTED',
      submissionUrl: 'http://example.com/repo',
      dueDate: new Date(Date.now() - 86400000 * 5), // 5 days ago
      submittedAt: new Date(Date.now() - 86400000 * 1), // 1 day ago (LATE)
      reviewDeadline: null,
    };
    const mockProject = { id: 'proj-1', activeDocumentVersion: 1 };

    const { verifiedFacts, deterministicAnalysis } = await evaluateDisputeFacts(mockDispute, mockMilestone, mockProject);

    expect(deterministicAnalysis.isLateDelivery).toBe(true);
    expect(verifiedFacts.some(f => f.includes('LATE DELIVERY'))).toBe(true);
  });

  test('Flags approved extension total days correctly', async () => {
    const mockDispute = { id: 'disp-2' };
    const mockMilestone = {
      title: 'Milestone 2',
      description: 'Design work',
      amount: 300,
      status: 'IN_PROGRESS',
      submissionUrl: null,
      dueDate: new Date(Date.now() + 86400000 * 3), // due in 3 days (not late yet)
      submittedAt: null,
      reviewDeadline: null,
    };
    const mockProject = { id: 'proj-1', activeDocumentVersion: 1 };

    const { deterministicAnalysis } = await evaluateDisputeFacts(mockDispute, mockMilestone, mockProject);

    expect(deterministicAnalysis.totalDaysExtension).toBe(5);
    expect(deterministicAnalysis.totalPaymentAdjustment).toBe(200);
  });

  test('Flags freelancer ghosting when freelancer has no messages', async () => {
    DisputeMessage.count.mockImplementation(async ({ where }) => {
      if (where.senderType === 'CLIENT') return 3;
      if (where.senderType === 'FREELANCER') return 0;
      return 0;
    });

    const mockDispute = { id: 'disp-3' };
    const mockMilestone = {
      title: 'Milestone 3', description: '', amount: 100, status: 'SUBMITTED',
      dueDate: null, submittedAt: null, reviewDeadline: null, submissionUrl: null,
    };
    const { verifiedFacts, deterministicAnalysis } = await evaluateDisputeFacts(mockDispute, mockMilestone, { id: 'proj-1', activeDocumentVersion: 1 });

    expect(deterministicAnalysis.freelancerMessageCount).toBe(0);
    expect(verifiedFacts).toContain('Freelancer has not responded to the dispute chat.');
  });

  test('Flags client ghosting when client has no messages', async () => {
    DisputeMessage.count.mockImplementation(async ({ where }) => {
      if (where.senderType === 'CLIENT') return 0;
      if (where.senderType === 'FREELANCER') return 2;
      return 0;
    });

    const mockDispute = { id: 'disp-4' };
    const mockMilestone = {
      title: 'Milestone 4', description: '', amount: 100, status: 'SUBMITTED',
      dueDate: null, submittedAt: null, reviewDeadline: null, submissionUrl: null,
    };
    const { verifiedFacts, deterministicAnalysis } = await evaluateDisputeFacts(mockDispute, mockMilestone, { id: 'proj-1', activeDocumentVersion: 1 });

    expect(deterministicAnalysis.clientMessageCount).toBe(0);
    expect(verifiedFacts).toContain('Client has not responded to the dispute chat.');
  });
});
