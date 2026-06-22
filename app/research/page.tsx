import Link from 'next/link';
import type { Metadata } from 'next';
import { reports, getModelData, getPriceTargetRange } from '@/data/reports';
import { getLivePrices } from '@/lib/livePrices';
import ResearchCardGrid, { type ResearchCard } from '@/components/ResearchCardGrid';
import styles from './research.module.css';

export const metadata: Metadata = {
  title: 'Equity Research — Lighthouse Capital Research',
};

export const revalidate = 86400;

export default async function ResearchIndex() {
  const livePrices = await getLivePrices(reports.map((r) => r.ticker));

  const cards: ResearchCard[] = reports.map((report) => {
    const modelData = getModelData(report.ticker);
    const target = modelData ? getPriceTargetRange(modelData) : null;
    const live = livePrices[report.ticker.toUpperCase()];
    const currentPriceLabel = live
      ? `$${live.price.toFixed(2)} (${new Date(live.asOf).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' })})`
      : modelData?.currentPrice != null
        ? `$${modelData.currentPrice.toFixed(2)} (snapshot)`
        : '—';
    return {
      ticker: report.ticker,
      exchange: report.exchange,
      name: report.name,
      rating: report.rating,
      category: report.category,
      sector: report.sector,
      industry: report.industry,
      reportDate: report.reportDate,
      summary: report.summary,
      priceTargetLabel: target ? `$${target.mid} – $${target.high}` : '—',
      currentPriceLabel,
    };
  });

  return (
    <>
      <div className={styles.pageHeader}>
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <span>›</span>
          Equity Research
        </div>
        <h1>Equity Research</h1>
        <p>Independent, fundamental analysis on high-conviction equity ideas across technology, special situations, and emerging markets.</p>
      </div>

      <ResearchCardGrid cards={cards} />
    </>
  );
}
