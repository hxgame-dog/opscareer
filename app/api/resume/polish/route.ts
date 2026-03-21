import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireCurrentUser } from '@/lib/auth-session';
import { streamGeminiText } from '@/lib/gemini';
import { buildResumePolishPrompt } from '@/lib/prompt-templates/resume-polish';
import { requireGeminiCredentials } from '@/lib/repositories';

const BodySchema = z.object({
  prompt: z.string().min(1),
  sectionType: z.enum(['experience', 'project']),
  identity: z.enum(['学生', '职场新人', '资深职场人']),
  targetRole: z.string().min(1),
  language: z.enum(['zh-CN', 'en-US']).default('zh-CN')
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireCurrentUser();
    const { apiKey, model } = await requireGeminiCredentials(user.id);
    const body = BodySchema.parse(await req.json());

    const prompt = buildResumePolishPrompt({
      sectionType: body.sectionType,
      identity: body.identity,
      targetRole: body.targetRole,
      language: body.language,
      text: body.prompt
    });

    const stream = await streamGeminiText({ apiKey, model, prompt });
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive'
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(message, { status: message === 'Authentication required.' ? 401 : 400 });
  }
}
