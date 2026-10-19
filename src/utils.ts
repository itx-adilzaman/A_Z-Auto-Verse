export function formatCurrency(value: number | string | undefined | null): string {
  if (value === undefined || value === null || isNaN(Number(value))) return '$0';
  const num = Number(value);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatNumber(value: number | string | undefined | null): string {
  if (value === undefined || value === null || isNaN(Number(value))) return '0';
  return new Intl.NumberFormat('en-US').format(Number(value));
}

export function formatDate(dateString?: string): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function safeJsonParse<T>(input: any, defaultValue: T): T {
  if (input === null || input === undefined) return defaultValue;
  if (Array.isArray(input)) return input as unknown as T;
  if (typeof input === 'object') return input as T;
  try {
    return JSON.parse(input);
  } catch {
    return defaultValue;
  }
}

export const FALLBACK_CAR_IMAGE =
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1400&q=80';
