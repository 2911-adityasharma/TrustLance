'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('project_messages', {
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
      senderId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
      },
      clientMessageId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      messageType: {
        type: Sequelize.ENUM('TEXT', 'FILE', 'CHANGE_REQUEST', 'SYSTEM'),
        allowNull: false,
        defaultValue: 'TEXT',
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      attachmentUrl: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      attachmentHash: {
        type: Sequelize.STRING,
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

    await queryInterface.addIndex('project_messages', ['senderId', 'clientMessageId'], {
      unique: true,
      name: 'unique_sender_client_message_id',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('project_messages');
  },
};
