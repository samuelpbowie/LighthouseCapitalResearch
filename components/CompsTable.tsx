import type { CompRow } from '@/lib/modelTypes';
import type { LivePrice } from '@/lib/livePrices';
import { median } from '@/lib/format';
import styles from '@/app/research/[ticker]/ticker.module.css';

const fmtB = (v: number | null) => (v == null ? '—' : `$${(v / 1000).toFixed(1)}B`);
const fmtM = (v: number | null) =>
  v == null ? '—' : v < 0 ? `($${Math.round(Math.abs(v)).toLocaleString()}M)` : `$${Math.round(v).toLocaleString()}M`;
const fmtMx = (v: number | null) => (v == null ? 'N/M' : `${v.toFixed(1)}x`);
const fmtP2 = (v: number | null) => (v == null ? '—' : `$${v.toFixed(2)}`);

interface Row {
  label: string;
  get: (c: CompRow) => number | string | null;
  fmt: (v: number | string | null) => string;
  med?: boolean;
  sep?: boolean;
}

const ROWS: Row[] = [
  { label: 'As Of', get: (c) => c.fileDate, fmt: (v) => (v as string) ?? '—' },
  { label: 'Price', get: (c) => c.price, fmt: (v) => fmtP2(v as number | null) },
  { label: 'Mkt Cap', get: (c) => c.mktCap, fmt: (v) => fmtB(v as number | null) },
  { label: 'EV', get: (c) => c.ev, fmt: (v) => fmtB(v as number | null) },
  { label: 'TTM Revenue', get: (c) => c.revenue, fmt: (v) => fmtM(v as number | null) },
  { label: 'TTM EBITDA', get: (c) => c.ebitda, fmt: (v) => fmtM(v as number | null) },
  { label: '', get: () => null, fmt: () => '', sep: true },
  { label: 'EV / Revenue', get: (c) => c.evRev, fmt: (v) => fmtMx(v as number | null), med: true },
  { label: 'EV / EBITDA', get: (c) => c.evEbitda, fmt: (v) => fmtMx(v as number | null), med: true },
  { label: 'P / E', get: (c) => c.pe, fmt: (v) => fmtMx(v as number | null), med: true },
];

export default function CompsTable({ comps, livePrices }: { comps: CompRow[]; livePrices?: Record<string, LivePrice | null> }) {
  const peers = comps.filter((c) => c.ticker !== 'OKTA');

  return (
    <div className={styles.fullWidthSection} id="comps-section" style={{ paddingTop: '3rem', paddingBottom: '5rem' }}>
      <h2 className={styles.sectionTitle}>Comparable Companies</h2>
      <div style={{ overflowX: 'auto' }}>
        <table className={styles.kpiTable}>
          <thead>
            <tr>
              <th />
              {comps.map((c) => {
                const isOkta = c.ticker === 'OKTA';
                return (
                  <th key={c.ticker} style={{ textAlign: 'center', whiteSpace: 'nowrap', background: isOkta ? 'var(--blue-light)' : undefined }}>
                    <span style={{ color: isOkta ? 'var(--blue-dark)' : 'var(--text)' }}>{c.name}</span><br />
                    <span style={{ fontWeight: 400, fontSize: '0.72rem', color: isOkta ? 'var(--blue)' : 'var(--muted)' }}>{c.ticker}</span>
                  </th>
                );
              })}
              <th style={{ textAlign: 'center', color: 'var(--muted)', fontWeight: 400, fontStyle: 'italic', whiteSpace: 'nowrap' }}>Peer Median</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, ri) => {
              if (row.sep) {
                return (
                  <tr key={ri}>
                    <td colSpan={comps.length + 2} style={{ height: 2, background: 'var(--border)', padding: 0, border: 'none' }} />
                  </tr>
                );
              }
              let medCell: string | null = null;
              if (row.med) {
                const vals = peers.map((c) => row.get(c)).filter((v): v is number => typeof v === 'number');
                const med = median(vals);
                medCell = med != null ? fmtMx(med) : '—';
              }
              return (
                <tr key={ri}>
                  <td style={{ color: 'var(--text)', fontWeight: 500, whiteSpace: 'nowrap' }}>{row.label}</td>
                  {comps.map((c) => {
                    const isOkta = c.ticker === 'OKTA';
                    return (
                      <td
                        key={c.ticker}
                        style={{ textAlign: 'right', background: isOkta ? 'var(--blue-light)' : undefined, color: isOkta ? 'var(--blue-dark)' : undefined, fontWeight: isOkta ? 600 : undefined }}
                      >
                        {row.fmt(row.get(c))}
                      </td>
                    );
                  })}
                  <td style={{ textAlign: 'right', color: 'var(--muted)', fontStyle: 'italic' }}>{row.med ? medCell : '—'}</td>
                </tr>
              );
            })}
            {livePrices && (
              <tr>
                <td style={{ color: 'var(--blue-dark)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                  Live Price <span className={styles.currentPriceBadge} style={{ marginLeft: '0.4rem', background: 'var(--blue)' }}>LIVE</span>
                </td>
                {comps.map((c) => {
                  const isOkta = c.ticker === 'OKTA';
                  const live = livePrices[c.ticker.toUpperCase()];
                  const cell = live
                    ? `${fmtP2(live.price)} · ${new Date(live.asOf).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                    : `${fmtP2(c.price)} (snapshot)`;
                  return (
                    <td
                      key={c.ticker}
                      style={{ textAlign: 'right', background: isOkta ? 'var(--blue-light)' : 'var(--offwhite)', color: isOkta ? 'var(--blue-dark)' : 'var(--text)', fontWeight: isOkta ? 600 : undefined, whiteSpace: 'nowrap' }}
                    >
                      {cell}
                    </td>
                  );
                })}
                <td style={{ textAlign: 'right', color: 'var(--muted)', fontStyle: 'italic' }}>—</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className={styles.tableNote} style={{ marginTop: '0.6rem' }}>
        N/M = not meaningful (negative or &gt;500× multiple). Peer Median excludes Okta.
      </p>
    </div>
  );
}
