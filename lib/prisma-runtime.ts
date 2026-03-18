export function getPrismaDatasourceUrl(
  env: Partial<Pick<NodeJS.ProcessEnv, 'NODE_ENV' | 'DATABASE_URL' | 'DATABASE_URL_UNPOOLED'>>
) {
  const pooled = env.DATABASE_URL?.trim();
  const unpooled = env.DATABASE_URL_UNPOOLED?.trim();

  if (env.NODE_ENV === 'development' && unpooled) {
    return unpooled;
  }

  return pooled || unpooled;
}
