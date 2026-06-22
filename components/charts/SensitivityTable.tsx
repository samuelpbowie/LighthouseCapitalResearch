'use client';

import { useState, type CSSProperties } from 'react';
import type { ModelData } from '@/lib/modelTypes';
import styles from '@/app/research/[ticker]/ticker.module.css';

type Tab = 'Weighted Average' | 'Base' | 'Pessimistic' | 'Optimistic';

const TABS: { key: Tab; label: string; activeClass: keyof typeof styles }[] = [
  { key: 'Weighted Average', label: 'Wtd Avg', activeClass: 'sensTabActiveWA' },
  { key: 'Base', label: 'Base', activeClass: 'sensTabActiveBase' },
  { key: 'Pessimistic', label: 'Bear', activeClass: 'sensTabActivePess' },
  { key: 'Optimistic', label: 'Bull', activeClass: 'sensTabActiveOpt' },
];

function cellColor(price: number | null, currentPrice: number | null) {
  if (price == null || currentPrice == null) return { bg: '#f1f5f9', text: '#94a3b8' };
  const pct = ((price - currentPrice) / currentPrice) * 100;
  if (pct > 20) return { bg: '#bbf7d0', text: '#14532d' };
  if (pct > 10) return { bg: '#dcfce7', text: '#166534' };
  if (pct > 0) return { bg: '#f0fdf4', text: '#166534' };
  if (pct > -10) return { bg: '#fff1f2', text: '#991b1b' };
  if (pct > -20) return { bg: '#fecaca', text: '#991b1b' };
  return { bg: '#fca5a5', text: '#7f1d1d' };
}

const BOX_COLOR = '#1e293b';
const BW = '2px';

export default function SensitivityTable({ dcf, currentPrice }: { dcf: ModelData['dcf']; currentPrice: number | null }) {
  const [activeTab, setActiveTab] = useState<Tab>('Weighted Average');

  const a = dcf.assumptions;
  const waccLabels = activeTab === 'Weighted Average' ? dcf.waccLabelsWA : dcf.waccLabels;
  const waccVals = activeTab === 'Weighted Average' ? dcf.waccValuesWA : dcf.waccValues;
  const rows = dcf.sensitivity[activeTab] || [];

  const cCol = waccVals.reduce<number>((best, w, i) => {
    if (w == null) return best;
    const bestVal = waccVals[best];
    return Math.abs(w - (a.wacc ?? 0)) < Math.abs((bestVal ?? Infinity) - (a.wacc ?? 0)) ? i : best;
  }, 0);
  const cRow = rows.reduce<number>((best, r2, i) => {
    if (r2.tgr == null) return best;
    const bestTgr = rows[best]?.tgr;
    return Math.abs(r2.tgr - (a.tgr ?? 0)) < Math.abs((bestTgr ?? Infinity) - (a.tgr ?? 0)) ? i : best;
  }, 0);

  const BOX = 1;
  const rMin = Math.max(0, cRow - BOX);
  const rMax = Math.min(rows.length - 1, cRow + BOX);
  const cMin = Math.max(0, cCol - BOX);
  const cMax = Math.min(waccLabels.length - 1, cCol + BOX);

  function boxBorders(ri: number, ci: number): CSSProperties {
    const inBox = ri >= rMin && ri <= rMax && ci >= cMin && ci <= cMax;
    const aboveTop = rMin > 0 && ri === rMin - 1 && ci >= cMin && ci <= cMax;
    if (!inBox && !aboveTop) return {};
    if (aboveTop) return { borderBottom: `${BW} solid ${BOX_COLOR}` };
    return {
      borderTop: ri === rMin ? `${BW} solid ${BOX_COLOR}` : undefined,
      borderBottom: ri === rMax ? `${BW} solid ${BOX_COLOR}` : undefined,
      borderLeft: ci === cMin ? `${BW} solid ${BOX_COLOR}` : undefined,
      borderRight: ci === cMax ? `${BW} solid ${BOX_COLOR}` : undefined,
    };
  }

  return (
    <div className={styles.section} id="sensitivity-section">
      <h2 className={styles.sectionTitle}>
        Implied Share Price Sensitivity
        {currentPrice != null && <span className={styles.currentPriceBadge}>Current: ${currentPrice.toFixed(2)}</span>}
      </h2>
      <p style={{ fontFamily: 'Arial,sans-serif', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '1rem' }}>
        Rows = Terminal Growth Rate (TGR) &nbsp;·&nbsp; Columns = WACC &nbsp;·&nbsp; Color intensity = % premium / discount to current price
      </p>
      <div className={styles.sensitivityTabs}>
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`${styles.sensTab} ${activeTab === t.key ? styles[t.activeClass] : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className={styles.sensitivityWrap}>
        <table className={styles.sensitivityTable}>
          <thead>
            <tr>
              <th className={styles.rowHeader}>TGR \ WACC</th>
              {waccLabels.map((w) => <th key={w}>{w}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => {
              const tgr = row.tgr != null ? (row.tgr * 100).toFixed(2) + '%' : '—';
              return (
                <tr key={ri}>
                  <td className={styles.tgrLabel}>{tgr}</td>
                  {row.prices.map((p, ci) => {
                    const bdr = boxBorders(ri, ci);
                    if (p == null) {
                      return <td key={ci} className={styles.tgrLabel} style={{ background: '#f1f5f9', color: '#94a3b8', ...bdr }}>—</td>;
                    }
                    const { bg, text } = cellColor(p, currentPrice);
                    const pct = currentPrice ? ((p - currentPrice) / currentPrice) * 100 : null;
                    return (
                      <td key={ci} className={styles.sensCell} style={{ background: bg, color: text, ...bdr }}>
                        ${p.toFixed(1)}
                        {pct != null && (
                          <>
                            <br />
                            <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>{pct >= 0 ? '+' : ''}{pct.toFixed(0)}%</span>
                          </>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className={styles.sensLegend}>
        <span className={styles.sensLegendItem}><span className={styles.sensSwatch} style={{ background: '#dcfce7', border: '1px solid #86efac' }} />&gt;20% upside</span>
        <span className={styles.sensLegendItem}><span className={styles.sensSwatch} style={{ background: '#bbf7d0', border: '1px solid #4ade80' }} />10–20% upside</span>
        <span className={styles.sensLegendItem}><span className={styles.sensSwatch} style={{ background: '#f0fdf4', border: '1px solid #86efac' }} />0–10% upside</span>
        <span className={styles.sensLegendItem}><span className={styles.sensSwatch} style={{ background: '#fff1f2', border: '1px solid #fca5a5' }} />0–10% downside</span>
        <span className={styles.sensLegendItem}><span className={styles.sensSwatch} style={{ background: '#fecaca', border: '1px solid #f87171' }} />10–20% downside</span>
        <span className={styles.sensLegendItem}><span className={styles.sensSwatch} style={{ background: '#fca5a5', border: '1px solid #ef4444' }} />&gt;20% downside</span>
      </div>
      <p className={styles.tableNote} style={{ marginTop: '1rem' }}>All implied prices in USD. See downloadable Excel model for full supporting schedules.</p>
    </div>
  );
}
