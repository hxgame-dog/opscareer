import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/crypto';

export async function getUserGeminiConfig(userId: string) {
  return prisma.geminiConfig.findUnique({ where: { userId } });
}

export async function requireGeminiCredentials(userId: string) {
  const cfg = await prisma.geminiConfig.findUnique({ where: { userId } });
  if (!cfg) {
    throw new Error('Gemini API key not configured.');
  }

  return {
    apiKey: decrypt(cfg.encryptedApiKey),
    model: cfg.selectedModel
  };
}
