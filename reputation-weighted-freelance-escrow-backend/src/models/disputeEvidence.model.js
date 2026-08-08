import { DataTypes, Model } from 'sequelize';
import { EVIDENCE_AUTHENTICITY } from '../utils/constants.js';

export class DisputeEvidence extends Model {}

export const initDisputeEvidenceModel = (sequelize) => {
  DisputeEvidence.init(
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
      submittedBy: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      evidenceType: {
        type: DataTypes.STRING,
        allowNull: false, // e.g. SCREENSHOT, CHAT_EXPORT, REPOSITORY_LINK, DELIVERABLE_FILE
      },
      source: {
        type: DataTypes.STRING,
        allowNull: false, // e.g. CLIENT_UPLOAD, SYSTEM_CHAT, GITHUB
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      fileUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      fileHash: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      authenticityStatus: {
        type: DataTypes.ENUM(Object.values(EVIDENCE_AUTHENTICITY)),
        allowNull: false,
        defaultValue: EVIDENCE_AUTHENTICITY.UNVERIFIED,
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'DisputeEvidence',
      tableName: 'dispute_evidences',
      timestamps: true,
      updatedAt: false,
    }
  );
  return DisputeEvidence;
};
