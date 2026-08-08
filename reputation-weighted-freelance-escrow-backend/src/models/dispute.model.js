import { DataTypes, Model } from 'sequelize';
import { DISPUTE_STATUS, DISPUTE_CATEGORY } from '../utils/constants.js';

export class Dispute extends Model {}

export const initDisputeModel = (sequelize) => {
  Dispute.init(
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
        allowNull: false,
      },
      raisedBy: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      category: {
        type: DataTypes.ENUM(Object.values(DISPUTE_CATEGORY)),
        allowNull: false,
      },
      initialClaim: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(Object.values(DISPUTE_STATUS)),
        allowNull: false,
        defaultValue: DISPUTE_STATUS.COLLECTING_CLAIM,
      },
      responseDeadline: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      resolvedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Dispute',
      tableName: 'disputes',
      timestamps: true,
    }
  );
  return Dispute;
};
