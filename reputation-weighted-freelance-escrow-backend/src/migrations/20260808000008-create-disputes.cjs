'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('disputes', {
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
        allowNull: false,
        references: { model: 'milestones', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      raisedBy: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
      },
      category: {
        type: Sequelize.ENUM(
          'INCOMPLETE_WORK',
          'LATE_DELIVERY',
          'PAYMENT_NOT_RELEASED',
          'REQUIREMENT_CHANGED',
          'POOR_QUALITY',
          'CLIENT_GHOSTING',
          'FREELANCER_GHOSTING',
          'PARTIAL_COMPLETION',
          'OTHER'
        ),
        allowNull: false,
      },
      initialClaim: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM(
          'COLLECTING_CLAIM',
          'WAITING_FOR_EVIDENCE',
          'WAITING_FOR_OTHER_PARTY',
          'ANALYZING',
          'RECOMMENDATION_READY',
          'UNDER_HUMAN_REVIEW',
          'RESOLVED',
          'CLOSED'
        ),
        allowNull: false,
        defaultValue: 'COLLECTING_CLAIM',
      },
      responseDeadline: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      resolvedAt: {
        type: Sequelize.DATE,
        allowNull: true,
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
    await queryInterface.dropTable('disputes');
  },
};
