import { jest } from '@jest/globals';
import { socketMessageSchema } from '../src/validators/message.validator.js';

describe('Socket.IO Message Schema & Duplicate Deduplication', () => {
  test('socketMessageSchema validates a valid message payload', () => {
    const validData = {
      projectId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      clientMessageId: 'client-msg-100',
      content: 'Hello freelancer!',
      messageType: 'TEXT',
    };

    const { error, value } = socketMessageSchema.validate(validData);
    expect(error).toBeUndefined();
    expect(value.clientMessageId).toBe('client-msg-100');
    expect(value.messageType).toBe('TEXT');
  });

  test('socketMessageSchema fails on missing required projectId', () => {
    const { error } = socketMessageSchema.validate({
      clientMessageId: 'msg-1',
      content: 'Missing projectId',
    });
    expect(error).toBeDefined();
    expect(error.details[0].path).toContain('projectId');
  });

  test('socketMessageSchema fails on missing clientMessageId', () => {
    const { error } = socketMessageSchema.validate({
      projectId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      content: 'Missing clientMessageId',
    });
    expect(error).toBeDefined();
    expect(error.details[0].path).toContain('clientMessageId');
  });

  test('socketMessageSchema fails on empty content', () => {
    const { error } = socketMessageSchema.validate({
      projectId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      clientMessageId: 'msg-1',
      content: '',
    });
    expect(error).toBeDefined();
  });

  test('socketMessageSchema allows optional milestoneId as UUID', () => {
    const { error, value } = socketMessageSchema.validate({
      projectId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      clientMessageId: 'msg-abc',
      content: 'Hello!',
      milestoneId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    });
    expect(error).toBeUndefined();
    expect(value.milestoneId).toBe('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22');
  });
});
