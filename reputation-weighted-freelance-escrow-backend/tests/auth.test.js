import request from 'supertest';
import { jest } from '@jest/globals';

// Mock sequelize before importing app so no real DB connection is made
jest.unstable_mockModule('../src/models/index.js', () => ({
  sequelize: { authenticate: jest.fn().mockResolvedValue(true), transaction: jest.fn((fn) => fn({})) },
  User: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
  },
  Project: { findByPk: jest.fn(), findAndCountAll: jest.fn() },
  ProjectDocument: {},
  DocumentApproval: {},
  Milestone: {},
  ChangeRequest: {},
  ProjectMessage: {},
  Dispute: {},
  DisputeMessage: {},
  DisputeEvidence: {},
  AiRecommendation: {},
  Notification: {},
  ReputationEvent: {},
}));

const { default: app } = await import('../src/app.js');
const { User } = await import('../src/models/index.js');

describe('Authentication Endpoints', () => {
  test('POST /api/v1/auth/register successfully registers a new client', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({
      id: 'user-new-1',
      name: 'New Client',
      email: 'newclient@example.com',
      role: 'CLIENT',
      toJSON: () => ({ id: 'user-new-1', name: 'New Client', email: 'newclient@example.com', role: 'CLIENT' }),
    });

    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'New Client',
      email: 'newclient@example.com',
      password: 'Password123!',
      role: 'CLIENT',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('newclient@example.com');
  });

  test('POST /api/v1/auth/register fails on duplicate email', async () => {
    User.findOne.mockResolvedValue({
      id: 'user-existing',
      email: 'existing@example.com',
    });

    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Duplicate',
      email: 'existing@example.com',
      password: 'Password123!',
      role: 'CLIENT',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/v1/auth/login returns 401 for unknown user', async () => {
    User.findOne.mockResolvedValue(null);

    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'nobody@example.com',
      password: 'wrongpass',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/v1/auth/me returns 401 when no token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });
});
