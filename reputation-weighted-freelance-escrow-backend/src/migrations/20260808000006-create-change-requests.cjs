'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('change_requests', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      projectId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'projects', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      milestoneId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'milestones', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      requestedBy: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      proposedChanges: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      paymentImpact: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      deadlineImpact: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'APPROVED', 'REJECTED'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      approvedByClient: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      approvedByFreelancer: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('change_requests');
  },
};
