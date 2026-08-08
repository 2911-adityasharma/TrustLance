import { isMimeAllowed, ALLOWED_MIME_TYPES } from '../src/services/storage.service.js';

describe('File Upload Security & Restrictions', () => {
  test('isMimeAllowed permits image/png', () => {
    expect(isMimeAllowed('image/png')).toBe(true);
  });

  test('isMimeAllowed permits image/jpeg', () => {
    expect(isMimeAllowed('image/jpeg')).toBe(true);
  });

  test('isMimeAllowed permits image/webp', () => {
    expect(isMimeAllowed('image/webp')).toBe(true);
  });

  test('isMimeAllowed permits application/pdf', () => {
    expect(isMimeAllowed('application/pdf')).toBe(true);
  });

  test('isMimeAllowed permits text/plain for chat exports', () => {
    expect(isMimeAllowed('text/plain')).toBe(true);
  });

  test('isMimeAllowed permits application/zip deliverables', () => {
    expect(isMimeAllowed('application/zip')).toBe(true);
  });

  test('isMimeAllowed rejects executable .exe files', () => {
    expect(isMimeAllowed('application/x-msdownload')).toBe(false);
  });

  test('isMimeAllowed rejects JavaScript files', () => {
    expect(isMimeAllowed('application/javascript')).toBe(false);
  });

  test('isMimeAllowed rejects HTML files', () => {
    expect(isMimeAllowed('text/html')).toBe(false);
  });

  test('isMimeAllowed rejects unknown MIME types', () => {
    expect(isMimeAllowed('application/octet-stream')).toBe(false);
    expect(isMimeAllowed('image/svg+xml')).toBe(false);
  });

  test('ALLOWED_MIME_TYPES array is defined and non-empty', () => {
    expect(Array.isArray(ALLOWED_MIME_TYPES)).toBe(true);
    expect(ALLOWED_MIME_TYPES.length).toBeGreaterThan(0);
  });
});
