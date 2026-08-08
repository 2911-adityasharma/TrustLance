import { DataTypes, Model } from 'sequelize';
import { MESSAGE_TYPE } from '../utils/constants.js';

export class ProjectMessage extends Model {}

export const initProjectMessageModel = (sequelize) => {
  ProjectMessage.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      projectId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      milestoneId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      senderId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      clientMessageId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      messageType: {
        type: DataTypes.ENUM(Object.values(MESSAGE_TYPE)),
        allowNull: false,
        defaultValue: MESSAGE_TYPE.TEXT,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      attachmentUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      attachmentHash: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'ProjectMessage',
      tableName: 'project_messages',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['senderId', 'clientMessageId'],
        },
      ],
    }
  );
  return ProjectMessage;
};
