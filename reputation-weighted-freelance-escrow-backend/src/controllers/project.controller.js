import { Project, User, ProjectMessage, Milestone } from '../models/index.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { getPagination, getPagingData } from '../utils/pagination.js';
import { PROJECT_STATUS, ROLES } from '../utils/constants.js';
import { Op } from 'sequelize';

export const createProject = asyncHandler(async (req, res) => {
  const { title, description, totalBudget, currency, freelancerEmail } = req.body;

  let freelancerId = null;
  let status = PROJECT_STATUS.DRAFT;

  if (freelancerEmail) {
    const freelancer = await User.findOne({ where: { email: freelancerEmail, role: ROLES.FREELANCER } });
    if (freelancer) {
      freelancerId = freelancer.id;
      status = PROJECT_STATUS.PENDING_FREELANCER;
    }
  }

  const project = await Project.create({
    clientId: req.user.id,
    freelancerId,
    title,
    description,
    totalBudget,
    currency: currency || 'USD',
    status,
  });

  return sendSuccess(res, 201, 'Project created successfully', { project });
});

export const getProjects = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query.page, req.query.limit);

  const whereCondition = {};
  if (req.user.role === ROLES.CLIENT) {
    whereCondition.clientId = req.user.id;
  } else if (req.user.role === ROLES.FREELANCER) {
    whereCondition.freelancerId = req.user.id;
  }

  const projectsData = await Project.findAndCountAll({
    where: whereCondition,
    limit,
    offset,
    order: [['createdAt', 'DESC']],
    include: [
      { model: User, as: 'client', attributes: ['id', 'name', 'email'] },
      { model: User, as: 'freelancer', attributes: ['id', 'name', 'email'] },
    ],
  });

  return sendSuccess(res, 200, 'Projects retrieved', getPagingData(projectsData, page, limit));
});

export const getProjectById = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const project = await Project.findByPk(projectId, {
    include: [
      { model: User, as: 'client', attributes: ['id', 'name', 'email', 'walletAddress'] },
      { model: User, as: 'freelancer', attributes: ['id', 'name', 'email', 'walletAddress'] },
      { model: Milestone, as: 'milestones' },
    ],
  });

  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  return sendSuccess(res, 200, 'Project details retrieved', { project });
});

export const updateProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const project = await Project.findByPk(projectId);

  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  if (project.clientId !== req.user.id && req.user.role !== ROLES.ADMIN) {
    throw new ApiError(403, 'Only project client or admin can update project metadata');
  }

  await project.update(req.body);
  return sendSuccess(res, 200, 'Project updated successfully', { project });
});

export const inviteFreelancer = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { freelancerEmail } = req.body;

  const project = await Project.findByPk(projectId);
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  const freelancer = await User.findOne({ where: { email: freelancerEmail, role: ROLES.FREELANCER } });
  if (!freelancer) {
    throw new ApiError(404, 'Freelancer with provided email not found');
  }

  project.freelancerId = freelancer.id;
  if (project.status === PROJECT_STATUS.DRAFT) {
    project.status = PROJECT_STATUS.PENDING_FREELANCER;
  }
  await project.save();

  return sendSuccess(res, 200, 'Freelancer invited successfully', { project });
});

export const acceptInvitation = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const project = await Project.findByPk(projectId);

  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  if (project.freelancerId !== req.user.id) {
    throw new ApiError(403, 'Invitation was sent to a different freelancer account');
  }

  if (project.activeDocumentVersion) {
    project.status = PROJECT_STATUS.ACTIVE;
  }
  await project.save();

  return sendSuccess(res, 200, 'Invitation accepted', { project });
});

export const getProjectMessages = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { page, limit, offset } = getPagination(req.query.page, req.query.limit);

  const messagesData = await ProjectMessage.findAndCountAll({
    where: { projectId },
    limit,
    offset,
    order: [['createdAt', 'DESC']],
    include: [{ model: User, as: 'sender', attributes: ['id', 'name', 'role'] }],
  });

  return sendSuccess(res, 200, 'Project conversation messages retrieved', getPagingData(messagesData, page, limit));
});
