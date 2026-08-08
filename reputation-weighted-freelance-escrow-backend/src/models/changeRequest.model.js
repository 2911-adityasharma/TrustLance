import { DataTypes, Model } from 'sequelize';
import { CHANGE_REQUEST_STATUS } from '../utils/constants.js';

export class ChangeRequest extends Model {}

export const initChangeRequestModel = (sequelize) => {
  ChangeRequest.init(
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
      requestedBy: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      proposedChanges: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      paymentImpact: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      deadlineImpact: {
        type: DataTypes.INTEGER, // in days
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.ENUM(Object.values(CHANGE_REQUEST_STATUS)),
        allowNull: false,
        defaultValue: CHANGE_REQUEST_STATUS.PENDING,
      },
      approvedByClient: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      approvedByFreelancer: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: 'ChangeRequest',
      tableName: 'change_requests',
      timestamps: true,
    }
  );
  return ChangeRequest;
};
