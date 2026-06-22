import type { ModelData } from '@/lib/modelTypes';
import styles from '@/app/research/[ticker]/ticker.module.css';

function UpDown({ price, currentPrice }: { price: number | null; currentPrice: number | null }) {
  if (price == null || currentPrice == null) return null;
  const pct = ((price - currentPrice) / currentPrice) * 100;
  return (
    <div className={styles.dcfUpdown} style={{ color: pct >= 0 ? 'var(--green)' : 'var(--red)' }}>
      {pct >= 0 ? '▲' : '▼'} {Math.abs(pct).toFixed(1)}% vs current
    </div>
  );
}

export default function DcfCards({ dcf, currentPrice }: { dcf: ModelData['dcf']; currentPrice: number | null }) {
  const waPrice = dcf.impliedPrices['Weighted Average'];
  const waEv = dcf.enterpriseValue['Weighted Average'];
  const a = dcf.assumptions;

  const cards = [
    { cls: styles.dcfCardBase, label: 'Base Case', price: dcf.impliedPrices.Base, ev: dcf.enterpriseValue.Base },
    { cls: styles.dcfCardPessimistic, label: 'Bear Case', price: dcf.impliedPrices.Pessimistic, ev: dcf.enterpriseValue.Pessimistic },
    { cls: styles.dcfCardOptimistic, label: 'Bull Case', price: dcf.impliedPrices.Optimistic, ev: dcf.enterpriseValue.Optimistic },
  ];

  return (
    <>
      <div className={styles.dcfWaRow}>
        <div className={`${styles.dcfCard} ${styles.dcfCardWeighted}`}>
          <div>
            <div className={styles.dcfLabel}>Weighted Average</div>
            <div className={styles.dcfPrice}>${waPrice != null ? waPrice.toFixed(2) : '—'}</div>
            <UpDown price={waPrice} currentPrice={currentPrice} />
          </div>
          <div className={styles.dcfWaMeta}>
            <span>50% Base · 15% Bear · 35% Bull</span>
            <span>EV: ${waEv != null ? (waEv / 1000).toFixed(1) : '—'}B</span>
            {currentPrice != null && <span>Current: ${currentPrice.toFixed(2)}</span>}
          </div>
        </div>
      </div>

      <div className={styles.dcfSummary}>
        {cards.map((c) => (
          <div key={c.label} className={`${styles.dcfCard} ${c.cls}`}>
            <div className={styles.dcfLabel}>{c.label}</div>
            <div className={styles.dcfPrice}>${c.price != null ? c.price.toFixed(2) : '—'}</div>
            <UpDown price={c.price ?? null} currentPrice={currentPrice} />
            <div className={styles.dcfSub}>EV: ${c.ev != null ? (c.ev / 1000).toFixed(1) : '—'}B</div>
          </div>
        ))}
      </div>

      <div className={styles.prose}>
        <p>
          DCF analysis uses a <strong>WACC of {a.wacc != null ? (a.wacc * 100).toFixed(2) + '%' : '—'}</strong>{' '}
          (risk-free rate: {a.riskFreeRate != null ? (a.riskFreeRate * 100).toFixed(2) + '%' : '—'}, ERP:{' '}
          {a.erp != null ? (a.erp * 100).toFixed(1) + '%' : '—'}, beta: {a.beta ?? '—'}) and a terminal growth rate of{' '}
          <strong>{a.tgr != null ? (a.tgr * 100).toFixed(2) + '%' : '—'}</strong> (long-run real GDP + breakeven inflation).
        </p>
      </div>
    </>
  );
}
