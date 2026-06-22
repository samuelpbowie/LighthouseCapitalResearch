export const fmt = (v: number | null | undefined, d = 0) =>
  v == null ? '—' : v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

export const fmtM = (v: number | null | undefined) =>
  v == null ? '—' : v < 0 ? `(${fmt(Math.abs(v))})` : fmt(v);

export const fmtP = (v: number | null | undefined) => (v == null ? '—' : `${fmt(v, 1)}%`);

export const fmtE = (v: number | null | undefined) =>
  v == null ? '—' : v < 0 ? `(${fmt(Math.abs(v), 2)})` : fmt(v, 2);

export type ScenarioName = 'Weighted Average' | 'Base' | 'Pessimistic' | 'Optimistic';

export const COLORS: Record<ScenarioName, string> = {
  'Weighted Average': '#6366f1',
  Base: '#1a56db',
  Pessimistic: '#dc2626',
  Optimistic: '#16a34a',
};

export function hexAlpha(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7),16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function median(arr: number[]) {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
