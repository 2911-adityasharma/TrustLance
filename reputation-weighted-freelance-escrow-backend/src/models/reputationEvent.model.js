import { DataTypes, Model } from 'sequelize';

export class ReputationEvent extends Model {}

export const initReputationEventModel = (sequelize) => {
  ReputationEvent.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      projectId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      disputeId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      eventType: {
        type: DataTypes.STRING,
        allowNull: false, // PROJECT_COMPLETED, DISPUTE_WON, DISPUTE_LOST, GHOSTED
      },
      scoreChange: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      transactionHash: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'ReputationEvent',
      tableName: 'reputation_events',
      timestamps: true,
      updatedAt: false,
    }
  );
  return ReputationEvent;
};
