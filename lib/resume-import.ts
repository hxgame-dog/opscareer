import { z } from 'zod';
import { generateGeminiJson } from '@/lib/gemini';
import { resumeToMarkdown } from '@/lib/markdown';
import { buildResumeImportPrompt } from '@/lib/prompt-templates/resume-import';
import { hashPrompt, sanitizePromptInput } from '@/lib/security';
import { Language, ProfileInput, ResumeDraft, ResumeImportPreview, ResumeTheme } from '@/types/domain';

export const ResumeImportRecognitionSchema = z.object({
  title: z.string().min(1).max(120),
  profile: z.object({
    basics: z.object({
      name: z.string(),
      email: z.string().email(),
      phone: z.string().optional().or(z.literal('')),
      location: z.string().optional().or(z.literal('')),
      summary: z.string(),
      yearsOfExperience: z.number().optional()
    }),
    experiences: z.array(
      z.object({
        company: z.string(),
        role: z.string(),
        start: z.string(),
        end: z.string().optional().or(z.literal('')),
        achievements: z.array(z.string()),
        techStack: z.array(z.string()).optional()
      })
    ),
    projects: z.array(
      z.object({
        name: z.string(),
        role: z.string().optional().or(z.literal('')),
        summary: z.string(),
        highlights: z.array(z.string())
      })
    ),
    skills: z.array(z.string()),
    education: z.array(
      z.object({
        school: z.string(),
        degree: z.string(),
        major: z.string().optional().or(z.literal('')),
        start: z.string().optional().or(z.literal('')),
        end: z.string().optional().or(z.literal(''))
      })
    ),
    language: z.enum(['zh-CN', 'en-US']).optional()
  }),
  resumeDraft: z.object({
    headline: z.string(),
    summary: z.string(),
    skills: z.array(z.string()),
    experiences: z.array(
      z.object({
        company: z.string(),
        role: z.string(),
        period: z.string(),
        bullets: z.array(z.string())
      })
    ),
    projects: z.array(
      z.object({
        name: z.string(),
        bullets: z.array(z.string())
      })
    ),
    education: z.array(
      z.object({
        school: z.string(),
        detail: z.string()
      })
    )
  })
});

export const ResumeImportPreviewSchema = z.object({
  filename: z.string().min(1),
  title: z.string().min(1).max(120),
  language: z.enum(['zh-CN', 'en-US']).optional(),
  theme: z.enum(['CLASSIC', 'EXECUTIVE', 'MODERN']),
  markdown: z.string().min(1),
  profile: ResumeImportRecognitionSchema.shape.profile,
  draft: ResumeImportRecognitionSchema.shape.resumeDraft
});

export function normalizeResumeImportPreview(input: z.input<typeof ResumeImportPreviewSchema>): ResumeImportPreview {
  const inferredLanguage = input.language ?? input.profile.language ?? 'zh-CN';
  const fallbackTitle =
    input.title.trim() ||
    input.draft.headline.trim() ||
    input.profile.basics.name.trim() ||
    '导入简历';

  return {
    filename: input.filename,
    title: fallbackTitle,
    language: inferredLanguage,
    theme: input.theme,
    markdown: input.markdown,
    profile: {
      ...input.profile,
      language: inferredLanguage
    },
    draft: input.draft
  };
}

export async function ensurePdfTextExtractionPolyfills() {
  if (globalThis.DOMMatrix && globalThis.ImageData && globalThis.Path2D) {
    return;
  }

  const requireFn = eval('require') as NodeRequire;
  const canvasModule = requireFn('@napi-rs/canvas') as {
    DOMMatrix?: typeof DOMMatrix;
    ImageData?: typeof ImageData;
    Path2D?: typeof Path2D;
  };
  globalThis.DOMMatrix = globalThis.DOMMatrix ?? canvasModule.DOMMatrix;
  globalThis.ImageData = globalThis.ImageData ?? canvasModule.ImageData;
  globalThis.Path2D = globalThis.Path2D ?? canvasModule.Path2D;
}

export async function extractResumeText(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith('.pdf')) {
    await ensurePdfTextExtractionPolyfills();
    const pdfParseModule = await import('pdf-parse');
    const parser = new pdfParseModule.PDFParse({ data: buffer });

    try {
      const result = await parser.getText();
      return result.text.trim();
    } finally {
      await parser.destroy();
    }
  }

  if (lowerName.endsWith('.docx')) {
    const mammothModule = await import('mammoth');
    const mammoth = mammothModule.default ?? mammothModule;
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  }

  if (lowerName.endsWith('.doc')) {
    throw new Error('旧版 .doc 暂不支持直接解析，请先转换为 .docx 或 PDF。');
  }

  throw new Error('仅支持 PDF、DOCX 简历导入。');
}

export async function recognizeResumeImport(params: {
  file: File;
  language: Language;
  theme: ResumeTheme;
  apiKey: string;
  model: string;
}) {
  const extractedText = await extractResumeText(params.file);
  if (!extractedText) {
    throw new Error('没有从文件中提取到可用文字内容。');
  }

  const prompt = buildResumeImportPrompt({
    extractedText: sanitizePromptInput(extractedText),
    language: params.language,
    filename: params.file.name
  });

  const generated = await generateGeminiJson<z.infer<typeof ResumeImportRecognitionSchema>>({
    apiKey: params.apiKey,
    model: params.model,
    prompt
  });
  const parsed = ResumeImportRecognitionSchema.parse(generated.data);

  const profile: ProfileInput = {
    ...parsed.profile,
    language: params.language
  };
  const draft: ResumeDraft = parsed.resumeDraft;
  const markdown = resumeToMarkdown(draft, params.theme);
  const preview = normalizeResumeImportPreview({
    filename: params.file.name,
    title: parsed.title,
    language: params.language,
    theme: params.theme,
    markdown,
    profile,
    draft
  });

  return {
    preview,
    trace: {
      promptHash: hashPrompt(prompt),
      outputJson: generated.rawText,
      latencyMs: generated.latencyMs,
      inputSnapshot: {
        filename: params.file.name,
        mimeType: params.file.type,
        language: params.language,
        theme: params.theme
      }
    }
  };
}
