import { fail } from '@/lib/response';
import { toUserErrorMessage } from '@/lib/errors';

export function apiFail(error: unknown) {
  const message = toUserErrorMessage(error);
  const status =
    message === 'Authentication required.'
      ? 401
      : /not found/i.test(message)
        ? 404
        : /invalid|required|请选择|缺少|不能|不存在|configured|selectedModel/i.test(message)
          ? 400
          : 400;

  return fail(message, status);
}
