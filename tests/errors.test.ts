import { describe, expect, it } from 'vitest';
import { toUserErrorMessage } from '../lib/errors';

describe('toUserErrorMessage', () => {
  it('maps database connection failures to a friendly hint', () => {
    const message = toUserErrorMessage(
      new Error("Invalid `prisma.user.findMany()` invocation: Can't reach database server at `example:5432`")
    );

    expect(message).toContain('数据库连接失败');
  });

  it('preserves regular application errors', () => {
    const message = toUserErrorMessage(new Error('Authentication required.'));
    expect(message).toBe('Authentication required.');
  });
});
