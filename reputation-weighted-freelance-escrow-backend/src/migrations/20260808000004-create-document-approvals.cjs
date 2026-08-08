'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('document_approvals', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      projectDocumentId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'project_documents', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      decision: {
        type: Sequelize.ENUM('APPROVED', 'REJECTED'),
        allowNull: false,
      },
      comment: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      walletSignature: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      approvedAt: {
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

    await queryInterface.addIndex('document_approvals', ['projectDocumentId', 'userId'], {
      unique: true,
      name: 'document_approval_user_unique',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('document_approvals');
  },
};
