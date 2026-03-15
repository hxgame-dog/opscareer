export function buildInterviewSummaryPrompt(payload: {
  company: string;
  role: string;
  jdText: string;
  roundName: string;
  notes: string;
  feedback?: string;
}) {
  return `你是面试复盘助手，请根据信息生成简洁的复盘总结，包含表现亮点、问题、下一步改进建议。\n\n公司: ${payload.company}\n岗位: ${payload.role}\n面试轮次: ${payload.roundName}\nJD:\n${payload.jdText}\n\n面试记录:\n${payload.notes}\n\n反馈:\n${payload.feedback ?? '无'}\n\n输出 JSON: {"summary":""}`;
}
