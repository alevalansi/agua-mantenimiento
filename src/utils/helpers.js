export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('he-IL');
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleString('he-IL');
}

export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - now) / (1000 * 60 * 60 * 24));
}

export function daysSince(dateStr) {
  if (!dateStr) return null;
  const now = new Date();
  const target = new Date(dateStr);
  return Math.round((now - target) / (1000 * 60 * 60 * 24));
}

export function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function todayISO() {
  return new Date().toISOString().split('T')[0];
}

export const STATUS_LABELS = {
  operational: 'פעיל',
  needs_maintenance: 'דורש תחזוקה',
  under_maintenance: 'בתחזוקה',
  faulty: 'תקול',
};

export const STATUS_COLORS = {
  operational: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  needs_maintenance: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  under_maintenance: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  faulty: 'text-red-400 bg-red-400/10 border-red-400/30',
};

export const ANALYZER_TYPES = {
  ph: 'pH',
  conductivity: 'מוליכות',
  turbidity: 'עכירות',
  boron: 'בורון',
  alkalinity: 'אלקליניטי',
  hardness: 'קשיות',
  sampler: 'דוגם',
  other: 'אחר',
};

export const MAINTENANCE_TYPES = {
  preventive: 'מניעתי',
  corrective: 'מתקן',
  calibration: 'כיול',
  inspection: 'בדיקה',
  chemical_renewal: 'חידוש כימיקל',
  other: 'אחר',
};

export const UNITS = ['מ"ל', 'ליטר', 'גרם', 'ק"ג', 'יחידה', 'קופסה'];
