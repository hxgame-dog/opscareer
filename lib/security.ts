const SUSPICIOUS_PATTERNS = [
  /ignore\s+previous\s+instructions?/gi,
  /system\s+prompt/gi,
  /developer\s+message/gi,
  /jailbreak/gi,
  /act\s+as\s+/gi,
  /reveal\s+prompt/gi
];

export function sanitizePromptInput(input: string) {
  let safe = input;
  for (const pattern of SUSPICIOUS_PATTERNS) {
    safe = safe.replace(pattern, '[redacted]');
  }
  return safe.trim();
}

export function hashPrompt(value: string) {
  return BunHash(value);
}

function BunHash(value: string) {
  // Keep this runtime-agnostic while stable across calls.
  let hash = 5381;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 33) ^ value.charCodeAt(i);
  }
  return `h${(hash >>> 0).toString(16)}`;
}
