import { describe, expect, it } from 'vitest';
import { pickPreferredGeminiModel } from '@/lib/gemini';

describe('pickPreferredGeminiModel', () => {
  it('prefers gemini 2.5 flash over deprecated 2.0 flash', () => {
    const selected = pickPreferredGeminiModel([
      { name: 'gemini-2.0-flash' },
      { name: 'gemini-2.5-flash' },
      { name: 'gemini-3.1-pro-preview' }
    ]);

    expect(selected).toBe('gemini-3.1-pro-preview');
  });

  it('keeps a valid user-selected model when available', () => {
    const selected = pickPreferredGeminiModel(
      [
        { name: 'gemini-2.5-flash' },
        { name: 'gemini-2.5-flash-lite' }
      ],
      'gemini-2.5-flash-lite'
    );

    expect(selected).toBe('gemini-2.5-flash-lite');
  });
});
