import { DataTypes, Model } from 'sequelize';
import { DOCUMENT_STATUS } from '../utils/constants.js';

export class ProjectDocument extends Model {}

export const initProjectDocumentModel = (sequelize) => {
  ProjectDocument.init(
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
      version: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      content: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      contentHash: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(Object.values(DOCUMENT_STATUS)),
        allowNull: false,
        defaultValue: DOCUMENT_STATUS.DRAFT,
      },
      createdBy: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      lockedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'ProjectDocument',
      tableName: 'project_documents',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['projectId', 'version'],
        },
      ],
    }
  );
  return ProjectDocument;
};
