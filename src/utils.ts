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

export const ADMIN_PROFILE = {
  name: 'Muhammad Adil Zaman',
  title: 'Founder & Chief Architect',
  role: 'Super Administrator',
  avatarUrl: '/src/assets/images/muhammad_adil_zaman_avatar.jpg',
  remoteAvatarUrl:
    'https://camo.githubusercontent.com/d8d6d485bfb0a9318e25ba0e75df600a0b923c7eb66c604a631a26c43ceed9af/68747470733a2f2f7265732e636c6f7564696e6172792e636f6d2f646b647a75796a63342f696d6167652f75706c6f61642f76313739323433323531352f313738343634343737343431325f6e736d6c79682e6a7067',
  badge: 'FOUNDER & ARCHITECT',
  email: 'ahmedzamanadilking@gmail.com',
  location: 'Global Operations',
};
