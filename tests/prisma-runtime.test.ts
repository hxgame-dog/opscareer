import { describe, expect, it } from 'vitest';
import { getPrismaDatasourceUrl } from '../lib/prisma-runtime';

describe('getPrismaDatasourceUrl', () => {
  it('prefers unpooled database url in development', () => {
    const result = getPrismaDatasourceUrl({
      NODE_ENV: 'development',
      DATABASE_URL: 'postgres://pooled',
      DATABASE_URL_UNPOOLED: 'postgres://direct'
    });

    expect(result).toBe('postgres://direct');
  });

  it('uses pooled database url outside development', () => {
    const result = getPrismaDatasourceUrl({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgres://pooled',
      DATABASE_URL_UNPOOLED: 'postgres://direct'
    });

    expect(result).toBe('postgres://pooled');
  });
});
