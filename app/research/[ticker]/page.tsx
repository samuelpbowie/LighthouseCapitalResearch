import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getReport, getModelData, getPriceTargetRange, reports } from '@/data/reports';
import { getLivePrices } from '@/lib/livePrices';
import TradingViewWidget from '@/components/charts/TradingViewWidget';
import FootballField from '@/components/charts/FootballField';
import FinancialModelSection from '@/components/charts/FinancialModelSection';
import DcfCards from '@/components/charts/DcfCards';
import SensitivityTable from '@/components/charts/SensitivityTable';
import CompsTable from '@/components/CompsTable';
import styles from './ticker.module.css';

// Live prices are refetched at most once a day; the page is otherwise statically served.
export const revalidate = 86400;

export function generateStaticParams() {
  return reports.map((r) => ({ ticker: r.ticker.toLowerCase() }));
}

export async function generateMetadata({ params }: { params: Promise<{ ticker: string }> }): Promise<Metadata> {
  const { ticker } = await params;
  const report = getReport(ticker);
  if (!report) return {};
  return { title: `${report.ticker} (${report.ticker}) — Lighthouse Capital Research` };
}

export default async function TickerPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  const report = getReport(ticker);
  const modelData = report ? getModelData(report.ticker) : undefined;

  if (!report || !modelData) notFound();

  const snapshotPrice = modelData.currentPrice;
  const livePrices = await getLivePrices(modelData.comps.map((c) => c.ticker));
  const liveOwn = livePrices[report.ticker.toUpperCase()];
  // "Current price" everywhere on this page means live-if-available, falling back to
  // the frozen Excel snapshot if the Yahoo Finance fetch failed — the snapshot itself
  // (As Of date + Price row in the comps table) is always shown separately, unchanged.
  const currentPrice = liveOwn?.price ?? snapshotPrice;
  const target = getPriceTargetRange(modelData);
  const modelFileHref = `/model_files/${encodeURIComponent(report.modelFileName)}`;

  return (
    <>
      <div className={styles.pageHeader}>
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link><span>›</span>
          <Link href="/research">Equity Research</Link><span>›</span>{report.name.replace(', Inc.', '')}
        </div>
        <div className={styles.tickerRow}>
          <h1>{report.name}</h1>
          <span className={styles.tickerBadge}>{report.exchange}: {report.ticker}</span>
        </div>
        <p className={styles.companyDesc}>{report.description}</p>
        <div className={styles.metaRow}>
          <div className={styles.metaItem}><label>Sector</label><span className={styles.value}>{report.sector}</span></div>
          <div className={styles.metaItem}><label>Industry</label><span className={styles.value}>{report.industry}</span></div>
          <div className={styles.metaItem}><label>Report Date</label><span className={styles.value}>{report.reportDate}</span></div>
          <div className={styles.metaItem}><label>Coverage</label><span className={`${styles.value} ${styles.positive}`}>Active</span></div>
        </div>
      </div>

      {/* Row 1 */}
      <div className={styles.pageRow}>
        <div className={styles.pageCol}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Investment Thesis</h2>
            <div className={styles.prose}>
              {report.thesisParagraphs.map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Bull vs. Bear</h2>
            <div className={styles.thesisGrid}>
              <div className={`${styles.thesisBox} ${styles.thesisBoxBull}`}>
                <h4>Bull Case</h4>
                <ul>{report.bullCase.map((b, i) => <li key={i}>{b}</li>)}</ul>
              </div>
              <div className={`${styles.thesisBox} ${styles.thesisBoxBear}`}>
                <h4>Bear Case</h4>
                <ul>{report.bearCase.map((b, i) => <li key={i}>{b}</li>)}</ul>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.pageCol}>
          <h2 className={styles.sectionTitle} aria-hidden="true" style={{ visibility: 'hidden', pointerEvents: 'none', marginBottom: 0 }}>&#8203;</h2>

          <div className={`${styles.lcrCompact} ${styles.section}`}>
            <div className={styles.lcrTop}>
              <span className={styles.lcrEyebrow}>LCR Rating</span>
              <div className={styles.ratingBadge} style={{ margin: 0, fontSize: '0.85rem', padding: '0.35rem 1rem' }}>{report.rating.toUpperCase()}</div>
            </div>
            <div className={styles.lcrStatsRow}>
              <div className={styles.lcrStatItem}>
                <span className={styles.sLabel}>Price Target</span>
                <span className={styles.sValue}>{target ? `$${target.mid} – $${target.high}` : '—'}</span>
              </div>
              <div className={styles.lcrStatItem}>
                <span className={styles.sLabel}>Current Price</span>
                <span className={styles.sValue}>
                  {currentPrice != null ? `$${currentPrice.toFixed(2)}` : '—'}
                  {liveOwn && currentPrice != null && (
                    <span style={{ color: 'var(--muted)', fontWeight: 400 }}>
                      {' '}({new Date(liveOwn.asOf).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' })})
                    </span>
                  )}
                  {!liveOwn && currentPrice != null && <span style={{ color: 'var(--muted)', fontWeight: 400, fontStyle: 'italic' }}> (snapshot)</span>}
                </span>
              </div>
              <div className={styles.lcrStatItem}>
                <span className={styles.sLabel}>Risk Rating</span>
                <span className={styles.sValue}>{report.riskRating}</span>
              </div>
              <div className={styles.lcrStatItem}>
                <span className={styles.sLabel}>Horizon</span>
                <span className={styles.sValue}>{report.horizon}</span>
              </div>
              <div className={styles.lcrStatItem}>
                <span className={styles.sLabel}>Updated</span>
                <span className={styles.sValue}>{report.updated}</span>
              </div>
              <div className={styles.lcrStatItem}>
                <span className={styles.sLabel}>Latest 10-K</span>
                <span className={styles.sValue}>
                  <a href={report.secFilingUrl} target="_blank" rel="noopener" style={{ color: 'var(--blue)', textDecoration: 'none' }}>{report.secFilingLabel}</a>
                </span>
              </div>
            </div>
            <a href={modelFileHref} className={styles.downloadBtn} download>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 1v9M4 7l4 4 4-4M2 13h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Download Excel Model
            </a>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Market Price — {report.exchange}: {report.ticker}</h2>
            <TradingViewWidget symbol={`${report.exchange}:${report.ticker}`} />
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Valuation Football Field</h2>
            <FootballField items={modelData.footballField} currentPrice={currentPrice} />
          </div>
        </div>
      </div>

      <div className={styles.rowSep} />

      {/* Row 2 */}
      <div className={`${styles.pageRow} ${styles.pageRowModel}`}>
        <FinancialModelSection modelData={modelData} reportUpdated={report.updated} />
      </div>

      <div className={styles.rowSep} />

      {/* Row 3 */}
      <div className={`${styles.pageRow} ${styles.pageRowDcf}`}>
        <div className={styles.pageCol}>
          <div className={styles.section} style={{ marginBottom: 0 }}>
            <h2 className={styles.sectionTitle}>DCF Valuation</h2>
            <DcfCards dcf={modelData.dcf} currentPrice={currentPrice} />
          </div>
        </div>
        <div className={styles.pageCol}>
          <SensitivityTable dcf={modelData.dcf} currentPrice={currentPrice} />
        </div>
      </div>

      <div className={styles.rowSep} />

      <CompsTable comps={modelData.comps} livePrices={livePrices} />
    </>
  );
}
