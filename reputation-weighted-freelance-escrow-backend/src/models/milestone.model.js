import { DataTypes, Model } from 'sequelize';
import { MILESTONE_STATUS } from '../utils/constants.js';

export class Milestone extends Model {}

export const initMilestoneModel = (sequelize) => {
  Milestone.init(
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
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      acceptanceCriteria: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      sequence: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      dueDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      reviewDeadline: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM(Object.values(MILESTONE_STATUS)),
        allowNull: false,
        defaultValue: MILESTONE_STATUS.DRAFT,
      },
      submissionUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      submissionHash: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      submittedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      approvedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Milestone',
      tableName: 'milestones',
      timestamps: true,
    }
  );
  return Milestone;
};
