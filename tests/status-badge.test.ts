import { describe, expect, it } from 'vitest';
import { getStatusBadgeTone } from '../lib/status-badge';

describe('getStatusBadgeTone', () => {
  it('returns success for positive states', () => {
    expect(getStatusBadgeTone('OFFER')).toBe('success');
    expect(getStatusBadgeTone('已关联投递')).toBe('success');
  });

  it('returns info for in-progress and neutral states', () => {
    expect(getStatusBadgeTone('IN_PROGRESS')).toBe('info');
    expect(getStatusBadgeTone('APPLIED')).toBe('info');
  });

  it('returns warn for negative or risky states', () => {
    expect(getStatusBadgeTone('REJECTED')).toBe('warn');
    expect(getStatusBadgeTone('WITHDRAWN')).toBe('warn');
  });
});
