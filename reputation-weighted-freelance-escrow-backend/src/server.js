import http from 'http';
import app from './app.js';
import { config } from './config/env.js';
import { logger } from './config/logger.js';
import { sequelize } from './models/index.js';
import { initSocket } from './socket.js';
import { initDisputeCronJob } from './jobs/disputeDeadline.job.js';

const server = http.createServer(app);

// Bind Socket.IO
const io = initSocket(server);

const startServer = async () => {
  try {
    // Authenticate database connection
    await sequelize.authenticate();
    logger.info('Database connection established successfully.');

    // Initialize anti-ghosting background cron job
    initDisputeCronJob();
    logger.info('Anti-ghosting background cron job scheduled.');

    server.listen(config.port, () => {
      logger.info(`🚀 Server running on port ${config.port} in ${config.env} mode`);
    });
  } catch (err) {
    logger.error('Failed to start server: %o', err);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export { server, io };
