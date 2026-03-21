import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/crypto';
import { fetchGeminiModels, pickPreferredGeminiModel } from '@/lib/gemini';

export async function getUserGeminiConfig(userId: string) {
  return prisma.geminiConfig.findUnique({ where: { userId } });
}

export async function requireGeminiCredentials(userId: string) {
  const cfg = await prisma.geminiConfig.findUnique({ where: { userId } });
  if (!cfg) {
    throw new Error('Gemini API key not configured.');
  }

  const apiKey = decrypt(cfg.encryptedApiKey);
  let availableModels = JSON.parse(cfg.availableModelsJson || '[]') as Array<{ name: string }>;

  if (availableModels.length === 0 || cfg.selectedModel.startsWith('gemini-2.0-')) {
    try {
      availableModels = await fetchGeminiModels(apiKey);
    } catch {
      // Keep existing cached models if refresh fails; downstream request will surface a clearer API error.
    }
  }

  const model = pickPreferredGeminiModel(availableModels, cfg.selectedModel) || cfg.selectedModel;

  if (model !== cfg.selectedModel || availableModels.length > 0) {
    await prisma.geminiConfig.update({
      where: { userId },
      data: {
        selectedModel: model,
        availableModelsJson: availableModels.length > 0 ? JSON.stringify(availableModels) : cfg.availableModelsJson
      }
    });
  }

  return {
    apiKey,
    model
  };
}
