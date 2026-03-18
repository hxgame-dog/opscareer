import { Language } from '@/types/domain';

export function buildResumeImportPrompt(params: {
  extractedText: string;
  language: Language;
  filename: string;
}) {
  const languageLabel = params.language === 'en-US' ? 'English' : '中文';

  return [
    `你是一个专业的简历解析助手。请把候选人的原始简历文本整理为结构化 JSON。输出语言使用 ${languageLabel}。`,
    '如果原文缺失某个字段，请尽量推断；无法推断时使用空字符串或空数组。',
    '不要编造夸张成果，不要添加原文中完全不存在的公司或项目。',
    '请只返回 JSON，结构必须严格符合：',
    `{
  "title": "",
  "profile": {
    "basics": {
      "name": "",
      "email": "placeholder@example.com",
      "phone": "",
      "location": "",
      "summary": "",
      "yearsOfExperience": 0
    },
    "experiences": [
      {
        "company": "",
        "role": "",
        "start": "",
        "end": "",
        "achievements": [""],
        "techStack": [""]
      }
    ],
    "projects": [
      {
        "name": "",
        "role": "",
        "summary": "",
        "highlights": [""]
      }
    ],
    "skills": [""],
    "education": [
      {
        "school": "",
        "degree": "",
        "major": "",
        "start": "",
        "end": ""
      }
    ],
    "language": "${params.language}"
  },
  "resumeDraft": {
    "headline": "",
    "summary": "",
    "skills": [""],
    "experiences": [
      {
        "company": "",
        "role": "",
        "period": "",
        "bullets": [""]
      }
    ],
    "projects": [
      {
        "name": "",
        "bullets": [""]
      }
    ],
    "education": [
      {
        "school": "",
        "detail": ""
      }
    ]
  }
}`,
    `文件名: ${params.filename}`,
    '原始简历文本如下：',
    params.extractedText
  ].join('\n\n');
}
