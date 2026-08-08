'use strict';

const ids = {
  client: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  freelancer: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
  arbitrator: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
  projects: [
    'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a56',
    'e2eebc99-9c0b-4ef8-bb6d-6bb9bd380a57',
    'e3eebc99-9c0b-4ef8-bb6d-6bb9bd380a58',
    'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a59',
  ],
  documents: [
    'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a61',
    'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a62',
    'f2eebc99-9c0b-4ef8-bb6d-6bb9bd380a63',
  ],
  approvals: [
    'a10ebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
    'a11ebc99-9c0b-4ef8-bb6d-6bb9bd380a02',
    'a12ebc99-9c0b-4ef8-bb6d-6bb9bd380a03',
    'a13ebc99-9c0b-4ef8-bb6d-6bb9bd380a04',
    'a14ebc99-9c0b-4ef8-bb6d-6bb9bd380a05',
    'a15ebc99-9c0b-4ef8-bb6d-6bb9bd380a06',
  ],
  milestones: [
    '110ebc99-9c0b-4ef8-bb6d-6bb9bd380a71',
    '111ebc99-9c0b-4ef8-bb6d-6bb9bd380a72',
    '112ebc99-9c0b-4ef8-bb6d-6bb9bd380a73',
    '113ebc99-9c0b-4ef8-bb6d-6bb9bd380a74',
    '114ebc99-9c0b-4ef8-bb6d-6bb9bd380a75',
  ],
  changeRequests: [
    '210ebc99-9c0b-4ef8-bb6d-6bb9bd380a81',
    '211ebc99-9c0b-4ef8-bb6d-6bb9bd380a82',
  ],
  messages: [
    '310ebc99-9c0b-4ef8-bb6d-6bb9bd380a91',
    '311ebc99-9c0b-4ef8-bb6d-6bb9bd380a92',
    '312ebc99-9c0b-4ef8-bb6d-6bb9bd380a93',
    '313ebc99-9c0b-4ef8-bb6d-6bb9bd380a94',
    '314ebc99-9c0b-4ef8-bb6d-6bb9bd380a95',
    '315ebc99-9c0b-4ef8-bb6d-6bb9bd380a96',
  ],
  dispute: '410ebc99-9c0b-4ef8-bb6d-6bb9bd380aa1',
  disputeMessages: [
    '510ebc99-9c0b-4ef8-bb6d-6bb9bd380ab1',
    '511ebc99-9c0b-4ef8-bb6d-6bb9bd380ab2',
    '512ebc99-9c0b-4ef8-bb6d-6bb9bd380ab3',
    '513ebc99-9c0b-4ef8-bb6d-6bb9bd380ab4',
  ],
  evidence: '610ebc99-9c0b-4ef8-bb6d-6bb9bd380ac1',
  recommendation: '710ebc99-9c0b-4ef8-bb6d-6bb9bd380ad1',
  notifications: [
    '810ebc99-9c0b-4ef8-bb6d-6bb9bd380ae1',
    '811ebc99-9c0b-4ef8-bb6d-6bb9bd380ae2',
    '812ebc99-9c0b-4ef8-bb6d-6bb9bd380ae3',
    '813ebc99-9c0b-4ef8-bb6d-6bb9bd380ae4',
    '814ebc99-9c0b-4ef8-bb6d-6bb9bd380ae5',
  ],
  reputationEvents: [
    '910ebc99-9c0b-4ef8-bb6d-6bb9bd380af1',
    '911ebc99-9c0b-4ef8-bb6d-6bb9bd380af2',
    '912ebc99-9c0b-4ef8-bb6d-6bb9bd380af3',
  ],
};

const primaryProjectId = 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55';

const offsetDate = (days, hours = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(date.getHours() + hours);
  return date;
};

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const now = new Date();
      const [pendingProjectId, disputeProjectId, completedProjectId, draftProjectId] = ids.projects;
      const [primaryDocumentId, disputeDocumentId, completedDocumentId] = ids.documents;
      const [approvedMilestoneId, submittedMilestoneId, fundedMilestoneId, disputedMilestoneId, completedMilestoneId] = ids.milestones;

      await queryInterface.bulkInsert('projects', [
        {
          id: pendingProjectId,
          clientId: ids.client,
          freelancerId: ids.freelancer,
          title: 'FinTech Mobile App UI',
          description: 'Design and implement a responsive dashboard for a personal finance application.',
          totalBudget: 3200.00,
          currency: 'USD',
          startDate: null,
          endDate: null,
          status: 'PENDING_FREELANCER',
          activeDocumentVersion: null,
          smartContractAddress: null,
          createdAt: offsetDate(-3),
          updatedAt: offsetDate(-1),
        },
        {
          id: disputeProjectId,
          clientId: ids.client,
          freelancerId: ids.freelancer,
          title: 'Analytics Dashboard Redesign',
          description: 'Redesign an analytics dashboard with accessible charts and responsive layouts.',
          totalBudget: 4500.00,
          currency: 'USD',
          startDate: offsetDate(-35),
          endDate: offsetDate(7),
          status: 'IN_DISPUTE',
          activeDocumentVersion: 1,
          smartContractAddress: '0x5555555555555555555555555555555555555555',
          createdAt: offsetDate(-40),
          updatedAt: offsetDate(-1),
        },
        {
          id: completedProjectId,
          clientId: ids.client,
          freelancerId: ids.freelancer,
          title: 'Restaurant Booking Website',
          description: 'Build a responsive restaurant discovery and table booking website.',
          totalBudget: 2800.00,
          currency: 'USD',
          startDate: offsetDate(-70),
          endDate: offsetDate(-15),
          status: 'COMPLETED',
          activeDocumentVersion: 1,
          smartContractAddress: '0x6666666666666666666666666666666666666666',
          createdAt: offsetDate(-75),
          updatedAt: offsetDate(-14),
        },
        {
          id: draftProjectId,
          clientId: ids.client,
          freelancerId: null,
          title: 'Healthcare Landing Page',
          description: 'Create a trustworthy marketing website for a digital healthcare startup.',
          totalBudget: 1800.00,
          currency: 'USD',
          startDate: null,
          endDate: null,
          status: 'DRAFT',
          activeDocumentVersion: null,
          smartContractAddress: null,
          createdAt: offsetDate(-1),
          updatedAt: now,
        },
      ], { transaction });

      await queryInterface.bulkInsert('project_documents', [
        {
          id: primaryDocumentId,
          projectId: primaryProjectId,
          version: 1,
          content: JSON.stringify({
            overview: 'Scalable REST API for a modern e-commerce platform.',
            deliverables: ['Authentication and roles', 'Product catalog', 'Cart and checkout', 'Order management'],
            technicalStack: ['Node.js', 'Express', 'MySQL', 'Sequelize'],
            acceptanceCriteria: ['API documentation is complete', 'Automated tests pass', 'Average response time stays below 500ms'],
          }),
          contentHash: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          status: 'APPROVED',
          createdBy: ids.client,
          lockedAt: offsetDate(-20),
          createdAt: offsetDate(-30),
          updatedAt: offsetDate(-20),
        },
        {
          id: disputeDocumentId,
          projectId: disputeProjectId,
          version: 1,
          content: JSON.stringify({
            overview: 'Redesign the analytics experience for desktop and mobile.',
            deliverables: ['Design system', 'Dashboard screens', 'Responsive React implementation'],
            acceptanceCriteria: ['All 12 screens delivered', 'WCAG AA contrast', 'Responsive from 375px to 1440px'],
          }),
          contentHash: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
          status: 'APPROVED',
          createdBy: ids.client,
          lockedAt: offsetDate(-32),
          createdAt: offsetDate(-38),
          updatedAt: offsetDate(-32),
        },
        {
          id: completedDocumentId,
          projectId: completedProjectId,
          version: 1,
          content: JSON.stringify({
            overview: 'Restaurant discovery and booking platform.',
            deliverables: ['Restaurant search', 'Availability calendar', 'Booking confirmation'],
            acceptanceCriteria: ['Mobile responsive', 'Booking flow tested', 'Production build delivered'],
          }),
          contentHash: 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
          status: 'APPROVED',
          createdBy: ids.client,
          lockedAt: offsetDate(-65),
          createdAt: offsetDate(-72),
          updatedAt: offsetDate(-65),
        },
      ], { transaction });

      await queryInterface.bulkInsert('document_approvals', [
        { id: ids.approvals[0], projectDocumentId: primaryDocumentId, userId: ids.client, decision: 'APPROVED', comment: 'Scope and deliverables approved.', walletSignature: 'demo-client-signature-1', approvedAt: offsetDate(-20), createdAt: offsetDate(-20), updatedAt: offsetDate(-20) },
        { id: ids.approvals[1], projectDocumentId: primaryDocumentId, userId: ids.freelancer, decision: 'APPROVED', comment: 'Timeline and criteria accepted.', walletSignature: 'demo-freelancer-signature-1', approvedAt: offsetDate(-20), createdAt: offsetDate(-20), updatedAt: offsetDate(-20) },
        { id: ids.approvals[2], projectDocumentId: disputeDocumentId, userId: ids.client, decision: 'APPROVED', comment: 'Approved for implementation.', walletSignature: 'demo-client-signature-2', approvedAt: offsetDate(-32), createdAt: offsetDate(-32), updatedAt: offsetDate(-32) },
        { id: ids.approvals[3], projectDocumentId: disputeDocumentId, userId: ids.freelancer, decision: 'APPROVED', comment: 'Requirements acknowledged.', walletSignature: 'demo-freelancer-signature-2', approvedAt: offsetDate(-32), createdAt: offsetDate(-32), updatedAt: offsetDate(-32) },
        { id: ids.approvals[4], projectDocumentId: completedDocumentId, userId: ids.client, decision: 'APPROVED', comment: 'Approved.', walletSignature: 'demo-client-signature-3', approvedAt: offsetDate(-65), createdAt: offsetDate(-65), updatedAt: offsetDate(-65) },
        { id: ids.approvals[5], projectDocumentId: completedDocumentId, userId: ids.freelancer, decision: 'APPROVED', comment: 'Approved.', walletSignature: 'demo-freelancer-signature-3', approvedAt: offsetDate(-65), createdAt: offsetDate(-65), updatedAt: offsetDate(-65) },
      ], { transaction });

      await queryInterface.bulkInsert('milestones', [
        {
          id: approvedMilestoneId,
          projectId: primaryProjectId,
          title: 'Authentication and Product Catalog',
          description: 'Implement user authentication, roles and product catalog APIs.',
          acceptanceCriteria: JSON.stringify(['JWT authentication works', 'Role checks are enforced', 'Catalog supports pagination']),
          amount: 1500.00,
          sequence: 1,
          dueDate: offsetDate(-10),
          reviewDeadline: offsetDate(-7),
          status: 'APPROVED',
          submissionUrl: 'https://github.com/example/ecommerce-api/releases/tag/v1.0.0',
          submissionHash: 'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
          submittedAt: offsetDate(-9),
          approvedAt: offsetDate(-7),
          createdAt: offsetDate(-25),
          updatedAt: offsetDate(-7),
        },
        {
          id: submittedMilestoneId,
          projectId: primaryProjectId,
          title: 'Cart and Checkout',
          description: 'Implement cart, discount and checkout workflows.',
          acceptanceCriteria: JSON.stringify(['Cart totals are accurate', 'Invalid coupons are rejected', 'Checkout creates an order']),
          amount: 2000.00,
          sequence: 2,
          dueDate: offsetDate(2),
          reviewDeadline: offsetDate(3),
          status: 'SUBMITTED',
          submissionUrl: 'https://github.com/example/ecommerce-api/pull/42',
          submissionHash: 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
          submittedAt: offsetDate(-1),
          approvedAt: null,
          createdAt: offsetDate(-18),
          updatedAt: offsetDate(-1),
        },
        {
          id: fundedMilestoneId,
          projectId: primaryProjectId,
          title: 'Order Management and Documentation',
          description: 'Complete order lifecycle endpoints and publish API documentation.',
          acceptanceCriteria: JSON.stringify(['Order status transitions are validated', 'OpenAPI documentation is available', 'Tests pass']),
          amount: 1500.00,
          sequence: 3,
          dueDate: offsetDate(14),
          reviewDeadline: null,
          status: 'FUNDED',
          submissionUrl: null,
          submissionHash: null,
          submittedAt: null,
          approvedAt: null,
          createdAt: offsetDate(-18),
          updatedAt: offsetDate(-18),
        },
        {
          id: disputedMilestoneId,
          projectId: disputeProjectId,
          title: 'Responsive Dashboard Implementation',
          description: 'Implement the approved analytics screens in React.',
          acceptanceCriteria: JSON.stringify(['All 12 screens delivered', 'Mobile navigation works', 'Charts match approved designs']),
          amount: 3000.00,
          sequence: 2,
          dueDate: offsetDate(-5),
          reviewDeadline: offsetDate(-2),
          status: 'DISPUTED',
          submissionUrl: 'https://demo.example.com/analytics-preview',
          submissionHash: 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
          submittedAt: offsetDate(-4),
          approvedAt: null,
          createdAt: offsetDate(-30),
          updatedAt: offsetDate(-1),
        },
        {
          id: completedMilestoneId,
          projectId: completedProjectId,
          title: 'Production Website Delivery',
          description: 'Deliver the complete booking website and deployment documentation.',
          acceptanceCriteria: JSON.stringify(['Booking works end to end', 'Responsive QA complete', 'Deployment guide provided']),
          amount: 2800.00,
          sequence: 1,
          dueDate: offsetDate(-20),
          reviewDeadline: offsetDate(-17),
          status: 'APPROVED',
          submissionUrl: 'https://restaurant-demo.example.com',
          submissionHash: 'abababababababababababababababababababababababababababababababab',
          submittedAt: offsetDate(-19),
          approvedAt: offsetDate(-17),
          createdAt: offsetDate(-68),
          updatedAt: offsetDate(-17),
        },
      ], { transaction });

      await queryInterface.bulkInsert('change_requests', [
        {
          id: ids.changeRequests[0],
          projectId: primaryProjectId,
          milestoneId: fundedMilestoneId,
          requestedBy: ids.freelancer,
          description: 'Add seven days for the order export and audit-log requirements.',
          proposedChanges: JSON.stringify({ add: ['CSV order export', 'Order audit log'], newDueDate: offsetDate(21).toISOString() }),
          paymentImpact: 250.00,
          deadlineImpact: 7,
          status: 'PENDING',
          approvedByClient: false,
          approvedByFreelancer: true,
          createdAt: offsetDate(-1),
          updatedAt: offsetDate(-1),
        },
        {
          id: ids.changeRequests[1],
          projectId: primaryProjectId,
          milestoneId: approvedMilestoneId,
          requestedBy: ids.client,
          description: 'Include category filtering in the initial product catalog scope.',
          proposedChanges: JSON.stringify({ add: ['Category filtering'], remove: [] }),
          paymentImpact: 0.00,
          deadlineImpact: 2,
          status: 'APPROVED',
          approvedByClient: true,
          approvedByFreelancer: true,
          createdAt: offsetDate(-16),
          updatedAt: offsetDate(-15),
        },
      ], { transaction });

      await queryInterface.bulkInsert('project_messages', [
        { id: ids.messages[0], projectId: primaryProjectId, milestoneId: null, senderId: ids.client, clientMessageId: 'demo-msg-client-001', messageType: 'TEXT', content: 'Hi Bob, the approved specification is ready. Please start with authentication.', attachmentUrl: null, attachmentHash: null, createdAt: offsetDate(-19), updatedAt: offsetDate(-19) },
        { id: ids.messages[1], projectId: primaryProjectId, milestoneId: null, senderId: ids.freelancer, clientMessageId: 'demo-msg-freelancer-001', messageType: 'TEXT', content: 'Thanks Alice. I have reviewed the scope and started the database models.', attachmentUrl: null, attachmentHash: null, createdAt: offsetDate(-19, 2), updatedAt: offsetDate(-19, 2) },
        { id: ids.messages[2], projectId: primaryProjectId, milestoneId: approvedMilestoneId, senderId: ids.freelancer, clientMessageId: 'demo-msg-freelancer-002', messageType: 'FILE', content: 'Milestone 1 API collection and test report.', attachmentUrl: '/uploads/demo-api-test-report.pdf', attachmentHash: 'demo-file-hash-001', createdAt: offsetDate(-9), updatedAt: offsetDate(-9) },
        { id: ids.messages[3], projectId: primaryProjectId, milestoneId: approvedMilestoneId, senderId: ids.client, clientMessageId: 'demo-msg-client-002', messageType: 'TEXT', content: 'Reviewed and approved. The catalog pagination looks good.', attachmentUrl: null, attachmentHash: null, createdAt: offsetDate(-7), updatedAt: offsetDate(-7) },
        { id: ids.messages[4], projectId: primaryProjectId, milestoneId: fundedMilestoneId, senderId: ids.freelancer, clientMessageId: 'demo-msg-freelancer-003', messageType: 'CHANGE_REQUEST', content: 'I submitted a change request for the new export and audit-log requirements.', attachmentUrl: null, attachmentHash: null, createdAt: offsetDate(-1), updatedAt: offsetDate(-1) },
        { id: ids.messages[5], projectId: disputeProjectId, milestoneId: disputedMilestoneId, senderId: ids.client, clientMessageId: 'demo-msg-client-003', messageType: 'SYSTEM', content: 'A dispute was opened for the responsive dashboard milestone.', attachmentUrl: null, attachmentHash: null, createdAt: offsetDate(-2), updatedAt: offsetDate(-2) },
      ], { transaction });

      await queryInterface.bulkInsert('disputes', [{
        id: ids.dispute,
        projectId: disputeProjectId,
        milestoneId: disputedMilestoneId,
        raisedBy: ids.client,
        category: 'PARTIAL_COMPLETION',
        initialClaim: 'Only eight of the twelve approved dashboard screens are complete and the mobile navigation is missing.',
        status: 'RECOMMENDATION_READY',
        responseDeadline: offsetDate(2),
        resolvedAt: null,
        createdAt: offsetDate(-2),
        updatedAt: offsetDate(-1),
      }], { transaction });

      await queryInterface.bulkInsert('dispute_messages', [
        { id: ids.disputeMessages[0], disputeId: ids.dispute, senderId: ids.client, senderType: 'CLIENT', content: 'The delivery is incomplete compared with the approved specification.', attachmentUrl: null, createdAt: offsetDate(-2) },
        { id: ids.disputeMessages[1], disputeId: ids.dispute, senderId: null, senderType: 'AI', content: 'Please identify the incomplete acceptance criteria and attach supporting evidence.', attachmentUrl: null, createdAt: offsetDate(-2, 1) },
        { id: ids.disputeMessages[2], disputeId: ids.dispute, senderId: ids.freelancer, senderType: 'FREELANCER', content: 'Eight screens are complete. The remaining four depend on chart data that was provided late.', attachmentUrl: null, createdAt: offsetDate(-1, -2) },
        { id: ids.disputeMessages[3], disputeId: ids.dispute, senderId: null, senderType: 'AI', content: 'Both parties have responded. The available evidence supports partial completion.', attachmentUrl: null, createdAt: offsetDate(-1) },
      ], { transaction });

      await queryInterface.bulkInsert('dispute_evidences', [{
        id: ids.evidence,
        disputeId: ids.dispute,
        submittedBy: ids.client,
        evidenceType: 'SCREENSHOT',
        source: 'CLIENT_UPLOAD',
        content: 'Comparison of the approved screen list with the delivered staging build.',
        fileUrl: '/uploads/demo-dashboard-comparison.png',
        fileHash: 'cdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcd',
        authenticityStatus: 'ACKNOWLEDGED_BY_BOTH',
        metadata: JSON.stringify({ originalName: 'dashboard-comparison.png', mimeType: 'image/png', demo: true }),
        createdAt: offsetDate(-1),
      }], { transaction });

      await queryInterface.bulkInsert('ai_recommendations', [{
        id: ids.recommendation,
        disputeId: ids.dispute,
        decision: 'PARTIAL_PAYMENT',
        freelancerPercentage: 70,
        clientRefundPercentage: 30,
        confidence: 84,
        summary: 'Most core dashboard work is complete, but four screens and the mobile navigation remain outstanding.',
        completedCriteria: JSON.stringify(['Eight dashboard screens delivered', 'Desktop layout implemented', 'Core charts functional']),
        incompleteCriteria: JSON.stringify(['Four screens missing', 'Mobile navigation missing']),
        verifiedFacts: JSON.stringify(['Approved scope contains twelve screens', 'Staging build contains eight completed screens']),
        assumptions: JSON.stringify(['Late chart data affected part of the delivery schedule']),
        missingInformation: JSON.stringify(['Exact date when final chart data was supplied']),
        evidenceReferences: JSON.stringify(['dashboard-comparison.png', 'Approved specification version 1']),
        requiresHumanReview: true,
        modelName: 'demo-recommendation',
        promptVersion: 'demo-v1',
        createdAt: offsetDate(-1),
      }], { transaction });

      await queryInterface.bulkInsert('notifications', [
        { id: ids.notifications[0], userId: ids.client, projectId: primaryProjectId, disputeId: null, type: 'MILESTONE_SUBMITTED', title: 'Milestone ready for review', message: 'Cart and Checkout was submitted by Bob Freelancer.', isRead: false, createdAt: offsetDate(-1), updatedAt: offsetDate(-1) },
        { id: ids.notifications[1], userId: ids.client, projectId: primaryProjectId, disputeId: null, type: 'CHANGE_REQUEST_CREATED', title: 'New change request', message: 'A seven-day extension and $250 budget adjustment need your response.', isRead: false, createdAt: offsetDate(-1, 1), updatedAt: offsetDate(-1, 1) },
        { id: ids.notifications[2], userId: ids.freelancer, projectId: pendingProjectId, disputeId: null, type: 'PROJECT_INVITATION', title: 'New project invitation', message: 'Alice invited you to FinTech Mobile App UI.', isRead: false, createdAt: offsetDate(-1), updatedAt: offsetDate(-1) },
        { id: ids.notifications[3], userId: ids.freelancer, projectId: primaryProjectId, disputeId: null, type: 'MILESTONE_APPROVED', title: 'Milestone approved', message: 'Authentication and Product Catalog was approved.', isRead: true, createdAt: offsetDate(-7), updatedAt: offsetDate(-6) },
        { id: ids.notifications[4], userId: ids.arbitrator, projectId: disputeProjectId, disputeId: ids.dispute, type: 'HUMAN_REVIEW_AVAILABLE', title: 'Dispute recommendation ready', message: 'Analytics Dashboard Redesign has a recommendation that may require human review.', isRead: false, createdAt: offsetDate(-1), updatedAt: offsetDate(-1) },
      ], { transaction });

      await queryInterface.bulkInsert('reputation_events', [
        { id: ids.reputationEvents[0], userId: ids.freelancer, projectId: primaryProjectId, disputeId: null, eventType: 'MILESTONE_APPROVED', scoreChange: 8, reason: 'Delivered and received approval for the first milestone.', transactionHash: null, createdAt: offsetDate(-7) },
        { id: ids.reputationEvents[1], userId: ids.client, projectId: primaryProjectId, disputeId: null, eventType: 'REVIEW_ON_TIME', scoreChange: 3, reason: 'Reviewed the submitted milestone before the deadline.', transactionHash: null, createdAt: offsetDate(-7) },
        { id: ids.reputationEvents[2], userId: ids.freelancer, projectId: completedProjectId, disputeId: null, eventType: 'PROJECT_COMPLETED', scoreChange: 15, reason: 'Successfully completed the restaurant booking website.', transactionHash: '0xdemo-completion-transaction', createdAt: offsetDate(-14) },
      ], { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    const removeByIds = (table, recordIds) => queryInterface.bulkDelete(
      table,
      { id: { [Sequelize.Op.in]: recordIds } },
      { transaction }
    );

    try {
      await removeByIds('reputation_events', ids.reputationEvents);
      await removeByIds('notifications', ids.notifications);
      await removeByIds('ai_recommendations', [ids.recommendation]);
      await removeByIds('dispute_evidences', [ids.evidence]);
      await removeByIds('dispute_messages', ids.disputeMessages);
      await removeByIds('disputes', [ids.dispute]);
      await removeByIds('project_messages', ids.messages);
      await removeByIds('change_requests', ids.changeRequests);
      await removeByIds('milestones', ids.milestones);
      await removeByIds('document_approvals', ids.approvals);
      await removeByIds('project_documents', ids.documents);
      await removeByIds('projects', ids.projects);
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
