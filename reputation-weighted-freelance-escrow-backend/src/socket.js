import { Server } from 'socket.io';
import cookie from 'cookie';
import { verifyToken } from './services/auth.service.js';
import { Project, ProjectMessage, User } from './models/index.js';
import { socketMessageSchema } from './validators/message.validator.js';
import { ROLES } from './utils/constants.js';
import { logger } from './config/logger.js';

export const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  // Socket Authentication Middleware
  io.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth?.token;

      if (!token && socket.handshake.headers.cookie) {
        const cookies = cookie.parse(socket.handshake.headers.cookie);
        token = cookies.token;
      }

      if (!token && socket.handshake.headers.authorization) {
        const authHeader = socket.handshake.headers.authorization;
        if (authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7);
        }
      }

      if (!token) {
        return next(new Error('Authentication token missing'));
      }

      const decoded = verifyToken(token);
      const user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['passwordHash'] },
      });

      if (!user || !user.isActive) {
        return next(new Error('Invalid or inactive user'));
      }

      socket.user = user;
      next();
    } catch (err) {
      logger.error('Socket authentication failed: %o', err);
      next(new Error('Unauthorized socket connection'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id} (User: ${socket.user.id}, Role: ${socket.user.role})`);

    // Event: project:join
    socket.on('project:join', async (data) => {
      try {
        const projectId = typeof data === 'string' ? data : data?.projectId;
        if (!projectId) {
          return socket.emit('message:error', { message: 'projectId is required' });
        }

        const project = await Project.findByPk(projectId);
        if (!project) {
          return socket.emit('message:error', { message: 'Project not found' });
        }

        const isClient = project.clientId === socket.user.id;
        const isFreelancer = project.freelancerId === socket.user.id;
        const isArbitratorOrAdmin = [ROLES.ARBITRATOR, ROLES.ADMIN].includes(socket.user.role);

        if (!isClient && !isFreelancer && !isArbitratorOrAdmin) {
          return socket.emit('message:error', { message: 'Unauthorized project room access' });
        }

        const roomName = `project:${projectId}`;
        socket.join(roomName);
        logger.info(`User ${socket.user.id} joined room ${roomName}`);
        socket.emit('project:joined', { projectId, room: roomName });
      } catch (err) {
        logger.error('Error joining project room: %o', err);
        socket.emit('message:error', { message: 'Failed to join project room' });
      }
    });

    // Event: project:leave
    socket.on('project:leave', (data) => {
      const projectId = typeof data === 'string' ? data : data?.projectId;
      if (projectId) {
        const roomName = `project:${projectId}`;
        socket.leave(roomName);
        socket.emit('project:left', { projectId, room: roomName });
      }
    });

    // Event: message:send
    socket.on('message:send', async (data) => {
      try {
        // 1. Validate payload with Joi
        const { error, value } = socketMessageSchema.validate(data);
        if (error) {
          return socket.emit('message:error', {
            clientMessageId: data?.clientMessageId,
            message: 'Validation failed',
            errors: error.details,
          });
        }

        const { projectId, clientMessageId, content, milestoneId, messageType, attachmentUrl, attachmentHash } = value;

        // 2. Verify project & sender authorization
        const project = await Project.findByPk(projectId);
        if (!project) {
          return socket.emit('message:error', { clientMessageId, message: 'Project not found' });
        }

        const isClient = project.clientId === socket.user.id;
        const isFreelancer = project.freelancerId === socket.user.id;
        const isArbitratorOrAdmin = [ROLES.ARBITRATOR, ROLES.ADMIN].includes(socket.user.role);

        if (!isClient && !isFreelancer && !isArbitratorOrAdmin) {
          return socket.emit('message:error', { clientMessageId, message: 'Unauthorized message sender' });
        }

        // 3 & 7. Save message directly via Sequelize ProjectMessage (Handle duplicate clientMessageId safely)
        let message;
        try {
          message = await ProjectMessage.create({
            projectId,
            milestoneId: milestoneId || null,
            senderId: socket.user.id,
            clientMessageId,
            messageType: messageType || 'TEXT',
            content,
            attachmentUrl: attachmentUrl || null,
            attachmentHash: attachmentHash || null,
          });
        } catch (dbErr) {
          // Handle duplicate (senderId + clientMessageId) unique constraint safely
          if (dbErr.name === 'SequelizeUniqueConstraintError') {
            message = await ProjectMessage.findOne({
              where: { senderId: socket.user.id, clientMessageId },
            });
            logger.info(`Duplicate message received (${clientMessageId}). Returning existing message.`);
          } else {
            throw dbErr;
          }
        }

        const messageData = message.toJSON();

        // 4 & 5. Emit message:new to project room
        const roomName = `project:${projectId}`;
        io.to(roomName).emit('message:new', messageData);

        // 6. Return message:ack to sender
        socket.emit('message:ack', {
          clientMessageId,
          serverMessageId: message.id,
          status: 'SENT',
          message: messageData,
        });
      } catch (err) {
        logger.error('Error handling message:send: %o', err);
        socket.emit('message:error', {
          clientMessageId: data?.clientMessageId,
          message: err.message || 'Internal error processing message',
        });
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};
