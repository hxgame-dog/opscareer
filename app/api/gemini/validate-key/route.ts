import { NextRequest } from 'next/server';
import { z } from 'zod';
import { encrypt, maskApiKey } from '@/lib/crypto';
import { requireCurrentUser } from '@/lib/auth-session';
import { prisma } from '@/lib/db';
import { validateGeminiKey } from '@/lib/gemini';
import { fail, ok } from '@/lib/response';

const Schema = z.object({
  apiKey: z.string().min(10),
  selectedModel: z.string().optional()
});

export async function POST(req: NextRequest) {
  try {
    const body = Schema.parse(await req.json());
    const user = await requireCurrentUser();
    const result = await validateGeminiKey(body.apiKey);

    if (!result.valid) {
      return fail('Gemini key is invalid or no generation-capable models found.', 400);
    }

    const selectedModel =
      body.selectedModel ?? result.models.find((m) => m.recommended)?.name ?? result.models[0].name;

    await prisma.geminiConfig.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        encryptedApiKey: encrypt(body.apiKey),
        maskedApiKey: maskApiKey(body.apiKey),
        selectedModel,
        availableModelsJson: JSON.stringify(result.models),
        lastValidatedAt: new Date()
      },
      update: {
        encryptedApiKey: encrypt(body.apiKey),
        maskedApiKey: maskApiKey(body.apiKey),
        selectedModel,
        availableModelsJson: JSON.stringify(result.models),
        lastValidatedAt: new Date()
      }
    });

    return ok({
      valid: true,
      selectedModel,
      maskedApiKey: maskApiKey(body.apiKey),
      models: result.models
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return fail(message, message === 'Authentication required.' ? 401 : 400);
  }
}
