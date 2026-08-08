import { DataTypes, Model } from 'sequelize';
import { APPROVAL_DECISION } from '../utils/constants.js';

export class DocumentApproval extends Model {}

export const initDocumentApprovalModel = (sequelize) => {
  DocumentApproval.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      projectDocumentId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      decision: {
        type: DataTypes.ENUM(Object.values(APPROVAL_DECISION)),
        allowNull: false,
      },
      comment: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      walletSignature: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      approvedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'DocumentApproval',
      tableName: 'document_approvals',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['projectDocumentId', 'userId'],
        },
      ],
    }
  );
  return DocumentApproval;
};
