'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('dispute_evidences', {
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
      submittedBy: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
      },
      evidenceType: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      source: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      fileUrl: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      fileHash: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      authenticityStatus: {
        type: Sequelize.ENUM('UNVERIFIED', 'ACKNOWLEDGED_BY_BOTH', 'DISPUTED', 'VERIFIED'),
        allowNull: false,
        defaultValue: 'UNVERIFIED',
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('dispute_evidences');
  },
};
