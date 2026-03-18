import { NextRequest } from 'next/server';
import { requireCurrentUser } from '@/lib/auth-session';
import { prisma } from '@/lib/db';
import { recognizeResumeImport } from '@/lib/resume-import';
import { requireGeminiCredentials } from '@/lib/repositories';
import { fail, ok } from '@/lib/response';

export async function POST(req: NextRequest) {
  try {
    const user = await requireCurrentUser();
    const { apiKey, model } = await requireGeminiCredentials(user.id);

    const form = await req.formData();
    const file = form.get('file');
    const theme = (form.get('theme')?.toString() ?? 'CLASSIC') as 'CLASSIC' | 'EXECUTIVE' | 'MODERN';
    const language = (form.get('language')?.toString() ?? 'zh-CN') as 'zh-CN' | 'en-US';

    if (!(file instanceof File)) {
      return fail('请上传 PDF 或 DOCX 简历文件。');
    }

    const { preview, trace } = await recognizeResumeImport({
      file,
      language,
      theme,
      apiKey,
      model
    });

    await prisma.generationRun.create({
      data: {
        userId: user.id,
        taskType: 'resume.import',
        model,
        promptHash: trace.promptHash,
        inputSnapshot: JSON.stringify(trace.inputSnapshot),
        outputJson: trace.outputJson,
        latencyMs: trace.latencyMs
      }
    });

    return ok(preview);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return fail(message, message === 'Authentication required.' ? 401 : 400);
  }
}
