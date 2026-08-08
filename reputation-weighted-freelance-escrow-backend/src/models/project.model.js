import { DataTypes, Model } from 'sequelize';
import { PROJECT_STATUS } from '../utils/constants.js';

export class Project extends Model {}

export const initProjectModel = (sequelize) => {
  Project.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      clientId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      freelancerId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      totalBudget: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      currency: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'USD',
      },
      startDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      endDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM(Object.values(PROJECT_STATUS)),
        allowNull: false,
        defaultValue: PROJECT_STATUS.DRAFT,
      },
      activeDocumentVersion: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      smartContractAddress: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Project',
      tableName: 'projects',
      timestamps: true,
    }
  );
  return Project;
};
