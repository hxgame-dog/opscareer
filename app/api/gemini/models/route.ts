import { requireCurrentUser } from '@/lib/auth-session';
import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/crypto';
import { fetchGeminiModels, pickPreferredGeminiModel } from '@/lib/gemini';
import { fail, ok } from '@/lib/response';
import { NextRequest } from 'next/server';
import { z } from 'zod';

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const cfg = await prisma.geminiConfig.findUnique({ where: { userId: user.id } });
    if (!cfg) {
      return fail('Gemini key is not configured.', 404);
    }

    const apiKey = decrypt(cfg.encryptedApiKey);
    const models = await fetchGeminiModels(apiKey);

    const selectedModel = pickPreferredGeminiModel(models, cfg.selectedModel);

    await prisma.geminiConfig.update({
      where: { userId: user.id },
      data: {
        availableModelsJson: JSON.stringify(models),
        selectedModel,
        lastValidatedAt: new Date()
      }
    });

    return ok({ models, selectedModel, maskedApiKey: cfg.maskedApiKey });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return fail(message, message === 'Authentication required.' ? 401 : 400);
  }
}

const UpdateSchema = z.object({
  selectedModel: z.string().min(1)
});

export async function POST(req: NextRequest) {
  try {
    const body = UpdateSchema.parse(await req.json());
    const user = await requireCurrentUser();
    const cfg = await prisma.geminiConfig.findUnique({ where: { userId: user.id } });
    if (!cfg) {
      return fail('Gemini key is not configured.', 404);
    }

    const apiKey = decrypt(cfg.encryptedApiKey);
    const cachedModels = JSON.parse(cfg.availableModelsJson) as Array<{ name: string; recommended?: boolean }>;
    let models = cachedModels;

    if (!models.some((m) => m.name === body.selectedModel)) {
      models = await fetchGeminiModels(apiKey);
    }

    if (!models.some((m) => m.name === body.selectedModel)) {
      return fail('selectedModel is not in available model list.', 400);
    }

    await prisma.geminiConfig.update({
      where: { userId: user.id },
      data: { selectedModel: body.selectedModel, availableModelsJson: JSON.stringify(models) }
    });

    return ok({ selectedModel: body.selectedModel });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return fail(message, message === 'Authentication required.' ? 401 : 400);
  }
}
