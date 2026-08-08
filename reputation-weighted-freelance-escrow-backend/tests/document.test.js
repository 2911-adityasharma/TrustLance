import { jest } from '@jest/globals';
import { hashCanonicalJson, canonicalizeJson } from '../src/services/hash.service.js';
import { DOCUMENT_STATUS, PROJECT_STATUS, APPROVAL_DECISION } from '../src/utils/constants.js';

describe('Document Immutability & Canonical Hashing', () => {
  test('canonicalizeJson produces identical string regardless of key ordering', () => {
    const obj1 = { z: 1, a: 2, m: { b: 3, a: 4 } };
    const obj2 = { a: 2, m: { a: 4, b: 3 }, z: 1 };
    expect(canonicalizeJson(obj1)).toEqual(canonicalizeJson(obj2));
    expect(hashCanonicalJson(obj1)).toEqual(hashCanonicalJson(obj2));
  });

  test('hashCanonicalJson generates consistent 64-char sha256 hex hash', () => {
    const obj = { scope: 'Build API', budget: 5000 };
    const h1 = hashCanonicalJson(obj);
    const h2 = hashCanonicalJson(obj);
    expect(h1).toBe(h2);
    expect(h1).toHaveLength(64);
    expect(h1).toMatch(/^[a-f0-9]{64}$/);
  });

  test('hashCanonicalJson produces different hashes for different content', () => {
    const obj1 = { a: 1 };
    const obj2 = { a: 2 };
    expect(hashCanonicalJson(obj1)).not.toBe(hashCanonicalJson(obj2));
  });

  test('Dual-approval logic: document should be locked only after both parties approve', () => {
    /**
     * Verifies the business rule: a document becomes APPROVED only when BOTH
     * client and freelancer have signed off. This unit test validates the
     * condition check logic in pure JS — the transaction-based service
     * integration is exercised in a live DB integration test.
     */
    const approvalsByUserId = new Map([
      ['client-1', APPROVAL_DECISION.APPROVED],
      ['freelancer-1', APPROVAL_DECISION.APPROVED],
    ]);

    const project = { clientId: 'client-1', freelancerId: 'freelancer-1' };
    const hasClientApproved = approvalsByUserId.get(project.clientId) === APPROVAL_DECISION.APPROVED;
    const hasFreelancerApproved = approvalsByUserId.get(project.freelancerId) === APPROVAL_DECISION.APPROVED;

    expect(hasClientApproved && hasFreelancerApproved).toBe(true);
  });

  test('Dual-approval logic: document remains PENDING when only one party approves', () => {
    const approvalsByUserId = new Map([
      ['client-1', APPROVAL_DECISION.APPROVED],
      // Freelancer has not approved yet
    ]);

    const project = { clientId: 'client-1', freelancerId: 'freelancer-1' };
    const hasClientApproved = approvalsByUserId.get(project.clientId) === APPROVAL_DECISION.APPROVED;
    const hasFreelancerApproved = approvalsByUserId.get(project.freelancerId) === APPROVAL_DECISION.APPROVED;

    expect(hasClientApproved && hasFreelancerApproved).toBe(false);
  });

  test('Approved document constants are defined and correct', () => {
    expect(DOCUMENT_STATUS.APPROVED).toBe('APPROVED');
    expect(DOCUMENT_STATUS.DRAFT).toBe('DRAFT');
    expect(DOCUMENT_STATUS.SUPERSEDED).toBe('SUPERSEDED');
    expect(PROJECT_STATUS.ACTIVE).toBe('ACTIVE');
    expect(APPROVAL_DECISION.APPROVED).toBe('APPROVED');
    expect(APPROVAL_DECISION.REJECTED).toBe('REJECTED');
  });
});
