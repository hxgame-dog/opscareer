export function toUserErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown error';

  if (/Can't reach database server/i.test(message) || /PrismaClientInitializationError/i.test(message)) {
    return '数据库连接失败，当前无法读取工作台数据。请检查本地网络、Neon 连接串，或稍后重试。';
  }

  return message;
}
