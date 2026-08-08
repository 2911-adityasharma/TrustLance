'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ai_recommendations', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      disputeId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'disputes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      decision: {
        type: Sequelize.ENUM(
          'FULL_PAYMENT',
          'FULL_REFUND',
          'PARTIAL_PAYMENT',
          'REVISION_REQUIRED',
          'DEADLINE_EXTENSION',
          'INSUFFICIENT_EVIDENCE'
        ),
        allowNull: false,
      },
      freelancerPercentage: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      clientRefundPercentage: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      confidence: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      summary: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      completedCriteria: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      incompleteCriteria: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      verifiedFacts: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      assumptions: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      missingInformation: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      evidenceReferences: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      requiresHumanReview: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      modelName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      promptVersion: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ai_recommendations');
  },
};
