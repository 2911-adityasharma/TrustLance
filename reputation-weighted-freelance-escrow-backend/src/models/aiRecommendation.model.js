import { DataTypes, Model } from 'sequelize';
import { AI_DECISIONS } from '../utils/constants.js';

export class AiRecommendation extends Model {}

export const initAiRecommendationModel = (sequelize) => {
  AiRecommendation.init(
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
      decision: {
        type: DataTypes.ENUM(Object.values(AI_DECISIONS)),
        allowNull: false,
      },
      freelancerPercentage: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      clientRefundPercentage: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      confidence: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      summary: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      completedCriteria: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
      },
      incompleteCriteria: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
      },
      verifiedFacts: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
      },
      assumptions: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
      },
      missingInformation: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
      },
      evidenceReferences: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
      },
      requiresHumanReview: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      modelName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      promptVersion: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'AiRecommendation',
      tableName: 'ai_recommendations',
      timestamps: true,
      updatedAt: false,
    }
  );
  return AiRecommendation;
};
