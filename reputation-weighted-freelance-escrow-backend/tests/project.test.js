import { jest } from '@jest/globals';
import request from 'supertest';

jest.unstable_mockModule('../src/models/index.js', () => ({
  sequelize: { authenticate: jest.fn(), transaction: jest.fn(async (fn) => await fn({})) },
  User: { findByPk: jest.fn(), findOne: jest.fn() },
  Project: {
    findByPk: jest.fn(),
    findAndCountAll: jest.fn(),
  },
  ProjectDocument: { findOne: jest.fn(), findAll: jest.fn(), update: jest.fn() },
  DocumentApproval: { findOne: jest.fn(), findAll: jest.fn(), create: jest.fn(), upsert: jest.fn() },
  Milestone: { findByPk: jest.fn() },
  ChangeRequest: {},
  ProjectMessage: {},
  Dispute: {},
  DisputeMessage: {},
  DisputeEvidence: {},
  AiRecommendation: {},
  Notification: { create: jest.fn() },
  ReputationEvent: {},
}));

const { User, Project, ProjectDocument, DocumentApproval, Notification } = await import('../src/models/index.js');
const { generateToken } = await import('../src/services/auth.service.js');
const { default: app } = await import('../src/app.js');

describe('Project Operations & Authorization', () => {
  const clientUser = { id: 'client-uuid-1', name: 'Client Alice', email: 'client@test.com', role: 'CLIENT', isActive: true };
  const strangerUser = { id: 'stranger-uuid-2', name: 'Stranger Danger', email: 'stranger@test.com', role: 'FREELANCER', isActive: true };
  const freelancerUser = { id: 'freelancer-uuid-3', name: 'Bob Freelancer', email: 'bob@test.com', role: 'FREELANCER', isActive: true };

  const clientToken = generateToken(clientUser);
  const strangerToken = generateToken(strangerUser);
  const freelancerToken = generateToken(freelancerUser);

  const mockProject = {
    id: 'proj-1',
    clientId: clientUser.id,
    freelancerId: freelancerUser.id,
    title: 'Test Project',
    description: 'Description of test project',
    totalBudget: 1000,
    currency: 'USD',
    status: 'PENDING_FREELANCER',
    activeDocumentVersion: null,
    save: jest.fn(async () => {}),
  };

  beforeEach(() => {
    User.findByPk.mockImplementation(async (id) => {
      if (id === clientUser.id) return { ...clientUser, toJSON: () => clientUser };
      if (id === strangerUser.id) return { ...strangerUser, toJSON: () => strangerUser };
      if (id === freelancerUser.id) return { ...freelancerUser, toJSON: () => freelancerUser };
      return null;
    });

    Project.findByPk.mockImplementation(async (id) => {
      if (id === 'proj-1') return mockProject;
      return null;
    });
  });

  test('GET /api/v1/projects/:projectId blocks unauthorized user access', async () => {
    const res = await request(app)
      .get('/api/v1/projects/proj-1')
      .set('Authorization', `Bearer ${strangerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/v1/projects/:projectId allows authorized client access', async () => {
    Project.findByPk.mockResolvedValue({
      ...mockProject,
      client: { id: clientUser.id, name: clientUser.name, email: clientUser.email },
      freelancer: { id: freelancerUser.id, name: freelancerUser.name, email: freelancerUser.email },
      milestones: [],
      toJSON: () => mockProject,
    });

    const res = await request(app)
      .get('/api/v1/projects/proj-1')
      .set('Authorization', `Bearer ${clientToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('POST /api/v1/projects/:projectId/accept-invitation allows invited freelancer to accept', async () => {
    const res = await request(app)
      .post('/api/v1/projects/proj-1/accept-invitation')
      .set('Authorization', `Bearer ${freelancerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
