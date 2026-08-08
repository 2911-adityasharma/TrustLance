import { DataTypes, Model } from 'sequelize';
import { DISPUTE_SENDER_TYPE } from '../utils/constants.js';

export class DisputeMessage extends Model {}

export const initDisputeMessageModel = (sequelize) => {
  DisputeMessage.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      disputeId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      senderId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      senderType: {
        type: DataTypes.ENUM(Object.values(DISPUTE_SENDER_TYPE)),
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      attachmentUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'DisputeMessage',
      tableName: 'dispute_messages',
      timestamps: true,
      updatedAt: false, // creation timestamp only per prompt
    }
  );
  return DisputeMessage;
};
