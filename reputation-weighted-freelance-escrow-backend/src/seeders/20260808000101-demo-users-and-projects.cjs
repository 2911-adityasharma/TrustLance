'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  async up(queryInterface, Sequelize) {
    const passwordHash = await bcrypt.hash('Password123!', 10);
    const clientId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const freelancerId = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
    const arbitratorId = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';
    const adminId = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44';

    const now = new Date();

    await queryInterface.bulkInsert('users', [
      {
        id: clientId,
        name: 'Alice Client',
        email: 'client@example.com',
        passwordHash,
        role: 'CLIENT',
        walletAddress: '0x1111111111111111111111111111111111111111',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: freelancerId,
        name: 'Bob Freelancer',
        email: 'freelancer@example.com',
        passwordHash,
        role: 'FREELANCER',
        walletAddress: '0x2222222222222222222222222222222222222222',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: arbitratorId,
        name: 'Charlie Arbitrator',
        email: 'arbitrator@example.com',
        passwordHash,
        role: 'ARBITRATOR',
        walletAddress: '0x3333333333333333333333333333333333333333',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: adminId,
        name: 'Dave Admin',
        email: 'admin@example.com',
        passwordHash,
        role: 'ADMIN',
        walletAddress: '0x4444444444444444444444444444444444444444',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    const projectId = 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55';
    await queryInterface.bulkInsert('projects', [
      {
        id: projectId,
        clientId,
        freelancerId,
        title: 'E-commerce API Development',
        description: 'Build scalable Node.js backend for modern e-commerce application',
        totalBudget: 5000.00,
        currency: 'USD',
        status: 'ACTIVE',
        activeDocumentVersion: 1,
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('projects', {
      id: 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
    });
    await queryInterface.bulkDelete('users', {
      id: {
        [Sequelize.Op.in]: [
          'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
          'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
          'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
        ],
      },
    });
  },
};
