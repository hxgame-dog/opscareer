export function toUserErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown error';

  if (/Can't reach database server/i.test(message) || /PrismaClientInitializationError/i.test(message)) {
    return '数据库连接失败，当前无法读取工作台数据。请检查本地网络、Neon 连接串，或稍后重试。';
  }

  if (/Gemini API key not configured/i.test(message) || /Gemini key is not configured/i.test(message)) {
    return '还没有配置 Gemini API Key，请先到设置页完成配置。';
  }

  if (/Gemini key is invalid/i.test(message) || /API key not valid/i.test(message)) {
    return 'Gemini Key 无效，或当前账号下没有可用模型，请检查后重试。';
  }

  if (/429|quota|rate limit|RESOURCE_EXHAUSTED/i.test(message)) {
    return '请求太频繁或模型额度不足，请稍后重试。';
  }

  if (/fetch failed|network|ECONNRESET|ETIMEDOUT|ENOTFOUND/i.test(message)) {
    return '网络请求失败，请检查网络连接后重试。';
  }

  if (/Authentication required/i.test(message)) {
    return 'Authentication required.';
  }

  return message;
}
