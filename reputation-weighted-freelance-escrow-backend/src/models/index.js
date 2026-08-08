import { Sequelize } from 'sequelize';
import dbConfig from '../config/database.js';
import { config } from '../config/env.js';

import { initUserModel, User } from './user.model.js';
import { initProjectModel, Project } from './project.model.js';
import { initProjectDocumentModel, ProjectDocument } from './projectDocument.model.js';
import { initDocumentApprovalModel, DocumentApproval } from './documentApproval.model.js';
import { initMilestoneModel, Milestone } from './milestone.model.js';
import { initChangeRequestModel, ChangeRequest } from './changeRequest.model.js';
import { initProjectMessageModel, ProjectMessage } from './projectMessage.model.js';
import { initDisputeModel, Dispute } from './dispute.model.js';
import { initDisputeMessageModel, DisputeMessage } from './disputeMessage.model.js';
import { initDisputeEvidenceModel, DisputeEvidence } from './disputeEvidence.model.js';
import { initAiRecommendationModel, AiRecommendation } from './aiRecommendation.model.js';
import { initNotificationModel, Notification } from './notification.model.js';
import { initReputationEventModel, ReputationEvent } from './reputationEvent.model.js';

const environment = config.env || 'development';
const envDbConfig = dbConfig[environment] || dbConfig.development;

export const sequelize = new Sequelize(
  envDbConfig.database,
  envDbConfig.username,
  envDbConfig.password,
  {
    host: envDbConfig.host,
    port: envDbConfig.port,
    dialect: envDbConfig.dialect || 'mysql',
    logging: envDbConfig.logging,
    pool: envDbConfig.pool,
  }
);

// Initialize Models
initUserModel(sequelize);
initProjectModel(sequelize);
initProjectDocumentModel(sequelize);
initDocumentApprovalModel(sequelize);
initMilestoneModel(sequelize);
initChangeRequestModel(sequelize);
initProjectMessageModel(sequelize);
initDisputeModel(sequelize);
initDisputeMessageModel(sequelize);
initDisputeEvidenceModel(sequelize);
initAiRecommendationModel(sequelize);
initNotificationModel(sequelize);
initReputationEventModel(sequelize);

// Associations
User.hasMany(Project, { foreignKey: 'clientId', as: 'clientProjects' });
User.hasMany(Project, { foreignKey: 'freelancerId', as: 'freelancerProjects' });
Project.belongsTo(User, { foreignKey: 'clientId', as: 'client' });
Project.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });

Project.hasMany(ProjectDocument, { foreignKey: 'projectId', as: 'documents' });
ProjectDocument.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
ProjectDocument.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

ProjectDocument.hasMany(DocumentApproval, { foreignKey: 'projectDocumentId', as: 'approvals' });
DocumentApproval.belongsTo(ProjectDocument, { foreignKey: 'projectDocumentId', as: 'document' });
DocumentApproval.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Project.hasMany(Milestone, { foreignKey: 'projectId', as: 'milestones' });
Milestone.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

Project.hasMany(ChangeRequest, { foreignKey: 'projectId', as: 'changeRequests' });
ChangeRequest.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
ChangeRequest.belongsTo(Milestone, { foreignKey: 'milestoneId', as: 'milestone' });
ChangeRequest.belongsTo(User, { foreignKey: 'requestedBy', as: 'requester' });

Project.hasMany(ProjectMessage, { foreignKey: 'projectId', as: 'messages' });
ProjectMessage.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
ProjectMessage.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
ProjectMessage.belongsTo(Milestone, { foreignKey: 'milestoneId', as: 'milestone' });

Project.hasMany(Dispute, { foreignKey: 'projectId', as: 'disputes' });
Dispute.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
Dispute.belongsTo(Milestone, { foreignKey: 'milestoneId', as: 'milestone' });
Dispute.belongsTo(User, { foreignKey: 'raisedBy', as: 'user' });

Dispute.hasMany(DisputeMessage, { foreignKey: 'disputeId', as: 'messages' });
DisputeMessage.belongsTo(Dispute, { foreignKey: 'disputeId', as: 'dispute' });
DisputeMessage.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

Dispute.hasMany(DisputeEvidence, { foreignKey: 'disputeId', as: 'evidences' });
DisputeEvidence.belongsTo(Dispute, { foreignKey: 'disputeId', as: 'dispute' });
DisputeEvidence.belongsTo(User, { foreignKey: 'submittedBy', as: 'submitter' });

Dispute.hasOne(AiRecommendation, { foreignKey: 'disputeId', as: 'aiRecommendation' });
AiRecommendation.belongsTo(Dispute, { foreignKey: 'disputeId', as: 'dispute' });

User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(ReputationEvent, { foreignKey: 'userId', as: 'reputationEvents' });
ReputationEvent.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export {
  User,
  Project,
  ProjectDocument,
  DocumentApproval,
  Milestone,
  ChangeRequest,
  ProjectMessage,
  Dispute,
  DisputeMessage,
  DisputeEvidence,
  AiRecommendation,
  Notification,
  ReputationEvent,
};
