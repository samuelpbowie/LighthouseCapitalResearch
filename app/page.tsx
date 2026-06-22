import Link from 'next/link';
import { reports, getModelData, getPriceTargetRange } from '@/data/reports';
import styles from './page.module.css';

const RATING_CLASS: Record<string, string> = {
  Buy: styles.ratingBuy,
  Hold: styles.ratingHold,
  Sell: styles.ratingSell,
};

export default function Home() {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.beacon}>
          <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="40" y1="30" x2="10" y2="5" stroke="#1a56db" strokeWidth="1" opacity="0.4" />
            <line x1="40" y1="30" x2="40" y2="2" stroke="#1a56db" strokeWidth="1" opacity="0.6" />
            <line x1="40" y1="30" x2="70" y2="5" stroke="#1a56db" strokeWidth="1" opacity="0.4" />
            <rect x="34" y="30" width="12" height="30" rx="1" fill="#1a56db" opacity="0.9" />
            <rect x="30" y="58" width="20" height="5" rx="1" fill="#1a56db" />
            <rect x="31" y="22" width="18" height="10" rx="2" fill="#1a56db" />
            <circle cx="40" cy="27" r="4" fill="#ffffff" />
            <circle cx="40" cy="27" r="2" fill="#93c5fd" />
            <rect x="26" y="63" width="28" height="4" rx="1" fill="#1a56db" opacity="0.6" />
          </svg>
        </div>
        <p className={styles.heroEyebrow}>Independent · Rigorous · Insightful</p>
        <h1>Illuminating Opportunity<br />Through <em>Deep Research</em></h1>
        <p className={styles.heroSub}>
          Lighthouse Capital Research delivers institutional-grade analysis to help investors navigate complexity and identify enduring value.
        </p>
        <div className={styles.btnGroup}>
          <a href="#research" className={`${styles.btn} ${styles.btnPrimary}`}>View Research</a>
          <a href="#contact" className={`${styles.btn} ${styles.btnOutline}`}>Get in Touch</a>
        </div>
      </section>

      <div className={styles.pageHeader} id="research">
        <div className={styles.pageHeaderInner}>
          <p className={styles.pageEyebrow}>Equity Research</p>
          <h1>Research Coverage</h1>
          <p>Institutional-grade analysis across equities, private credit, and emerging markets.</p>
        </div>
      </div>

      <section className={styles.researchSection}>
        <div className={styles.researchGrid}>
          {reports.length === 0 && (
            <div className={styles.emptyState}>No research published yet.</div>
          )}
          {reports.map((report) => {
            const modelData = getModelData(report.ticker);
            const target = modelData ? getPriceTargetRange(modelData) : null;
            return (
              <Link
                key={report.ticker}
                href={`/research/${report.ticker.toLowerCase()}`}
                className={styles.researchTile}
              >
                <div className={styles.tileTop}>
                  <span className={styles.tileTicker}>{report.exchange}: {report.ticker}</span>
                  <span className={`${styles.tileRating} ${RATING_CLASS[report.rating]}`}>{report.rating}</span>
                </div>
                <div className={styles.tileCompany}>{report.name}</div>
                <div className={styles.tileMeta}>
                  <span className={styles.tileMetaItem}>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="1" y="3" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M5 1v4M11 1v4M1 7h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    {report.reportDate}
                  </span>
                  <span className={styles.tileMetaItem}>{report.sector} · {report.industry}</span>
                </div>
                <p className={styles.tileSummary}>{report.summary}</p>
                <div className={styles.tileFooter}>
                  <div className={styles.tileTarget}>
                    Price Target&nbsp; <strong>{target ? `$${target.mid} – $${target.high}` : '—'}</strong>
                  </div>
                  <span className={styles.tileArrow}>→</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
