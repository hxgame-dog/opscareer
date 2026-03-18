export type StatusBadgeTone = 'default' | 'success' | 'warn' | 'info';

export function getStatusBadgeTone(value: string): StatusBadgeTone {
  const normalized = value.trim().toUpperCase();

  if (
    normalized.includes('OFFER') ||
    normalized.includes('SUCCESS') ||
    normalized.includes('ACTIVE') ||
    normalized.includes('已关联')
  ) {
    return 'success';
  }

  if (
    normalized.includes('REJECT') ||
    normalized.includes('WITHDRAW') ||
    normalized.includes('ERROR') ||
    normalized.includes('FAILED') ||
    normalized.includes('RISK')
  ) {
    return 'warn';
  }

  if (
    normalized.includes('IN_PROGRESS') ||
    normalized.includes('APPLIED') ||
    normalized.includes('SCREENING') ||
    normalized.includes('TECHNICAL') ||
    normalized.includes('FINAL') ||
    normalized.includes('INFO')
  ) {
    return 'info';
  }

  return 'default';
}
