import cron from 'node-cron';
import { Op } from 'sequelize';
import { sequelize, Dispute, Project, DisputeMessage } from '../models/index.js';
import { DISPUTE_STATUS, DISPUTE_SENDER_TYPE, DISPUTE_CATEGORY } from '../utils/constants.js';
import { runHybridAnalysis } from '../services/dispute.service.js';
import { createNotification } from '../services/notification.service.js';
import { logger } from '../config/logger.js';

let isJobRunning = false;

export const processExpiredDisputeDeadlines = async () => {
  if (isJobRunning) {
    logger.debug('Dispute deadline job is already executing, skipping concurrent run.');
    return;
  }

  isJobRunning = true;

  try {
    const expiredDisputes = await Dispute.findAll({
      where: {
        status: DISPUTE_STATUS.WAITING_FOR_OTHER_PARTY,
        responseDeadline: {
          [Op.lt]: new Date(),
        },
      },
    });

    for (const dispute of expiredDisputes) {
      await sequelize.transaction(async (t) => {
        // Lock row and re-verify status
        const lockedDispute = await Dispute.findByPk(dispute.id, {
          transaction: t,
          lock: true,
        });

        if (!lockedDispute || lockedDispute.status !== DISPUTE_STATUS.WAITING_FOR_OTHER_PARTY) {
          return;
        }

        const project = await Project.findByPk(lockedDispute.projectId, { transaction: t });
        if (!project) return;

        // Determine who ghosted / failed to respond
        const clientMessages = await DisputeMessage.count({
          where: { disputeId: lockedDispute.id, senderType: DISPUTE_SENDER_TYPE.CLIENT },
          transaction: t,
        });
        const freelancerMessages = await DisputeMessage.count({
          where: { disputeId: lockedDispute.id, senderType: DISPUTE_SENDER_TYPE.FREELANCER },
          transaction: t,
        });

        let ghostedParty = null;
        let ghostedUserId = null;
        if (clientMessages === 0 && lockedDispute.raisedBy !== project.clientId) {
          ghostedParty = 'CLIENT';
          ghostedUserId = project.clientId;
          lockedDispute.category = DISPUTE_CATEGORY.CLIENT_GHOSTING;
        } else if (freelancerMessages === 0 && lockedDispute.raisedBy !== project.freelancerId) {
          ghostedParty = 'FREELANCER';
          ghostedUserId = project.freelancerId;
          lockedDispute.category = DISPUTE_CATEGORY.FREELANCER_GHOSTING;
        }

        lockedDispute.status = DISPUTE_STATUS.ANALYZING;
        await lockedDispute.save({ transaction: t });

        // Record system message
        await DisputeMessage.create(
          {
            disputeId: lockedDispute.id,
            senderId: null,
            senderType: DISPUTE_SENDER_TYPE.SYSTEM,
            content: `Dispute response deadline expired. ${ghostedParty ? `${ghostedParty} failed to respond within the deadline (Ghosting detected).` : 'Proceeding with available evidence.'}`,
          },
          { transaction: t }
        );

        if (ghostedUserId) {
          await createNotification({
            userId: ghostedUserId,
            projectId: project.id,
            disputeId: lockedDispute.id,
            type: 'DEADLINE_EXPIRATION',
            title: 'Dispute Response Deadline Expired',
            message: 'Your deadline to respond to the dispute expired. AI analysis launched with existing evidence.',
          });
        }
      });

      // Run AI hybrid analysis outside of lock transaction
      try {
        await runHybridAnalysis(dispute.id);
      } catch (err) {
        logger.error(`Failed to run hybrid AI analysis for dispute ${dispute.id}: %o`, err);
      }
    }
  } catch (err) {
    logger.error('Error processing expired dispute deadlines: %o', err);
  } finally {
    isJobRunning = false;
  }
};

/**
 * Initializes the anti-ghosting background cron schedule (runs every hour)
 */
export const initDisputeCronJob = () => {
  cron.schedule('0 * * * *', async () => {
    logger.info('Running background anti-ghosting dispute deadline check...');
    await processExpiredDisputeDeadlines();
  });
};
