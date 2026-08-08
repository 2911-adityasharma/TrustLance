import { Project } from '../models/index.js';
import { ROLES } from '../utils/constants.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const checkProjectAccess = asyncHandler(async (req, res, next) => {
  const projectId = req.params.projectId || req.body.projectId || req.query.projectId;

  if (!projectId) {
    throw new ApiError(400, 'projectId is required for authorization');
  }

  const project = await Project.findByPk(projectId);
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  const isClient = project.clientId === req.user.id;
  const isFreelancer = project.freelancerId === req.user.id;
  const isAdminOrArbitrator = [ROLES.ADMIN, ROLES.ARBITRATOR].includes(req.user.role);

  if (!isClient && !isFreelancer && !isAdminOrArbitrator) {
    throw new ApiError(403, 'Forbidden: You are not authorized to access this project');
  }

  req.project = project;
  next();
});
