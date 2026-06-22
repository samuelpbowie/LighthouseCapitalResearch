'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import styles from '@/app/research/research.module.css';

export interface ResearchCard {
  ticker: string;
  exchange: string;
  name: string;
  rating: 'Buy' | 'Hold' | 'Sell';
  category: string;
  sector: string;
  industry: string;
  reportDate: string;
  summary: string;
  priceTargetLabel: string;
  currentPriceLabel: string;
}

const FILTERS = ['All', 'Technology', 'Special Situations', 'Emerging Markets'];

const RATING_CLASS: Record<string, string> = {
  Buy: styles.ratingBuy,
  Hold: styles.ratingHold,
  Sell: styles.ratingSell,
};

export default function ResearchCardGrid({ cards }: { cards: ResearchCard[] }) {
  const [activeFilter, setActiveFilter] = useState('All');

  const filtered = useMemo(
    () => (activeFilter === 'All' ? cards : cards.filter((c) => c.category === activeFilter)),
    [cards, activeFilter],
  );

  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.filterGroup}>
          {FILTERS.map((f) => (
            <button
              key={f}
              className={`${styles.filterBtn} ${activeFilter === f ? styles.filterBtnActive : ''}`}
              onClick={() => setActiveFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <span className={styles.resultCount}>{filtered.length} report{filtered.length === 1 ? '' : 's'}</span>
      </div>

      <div className={styles.researchWrap}>
        <div className={styles.researchGrid}>
          {filtered.length === 0 && (
            <div className={styles.emptyState}>No reports match this filter yet.</div>
          )}
          {filtered.map((card) => (
            <Link key={card.ticker} href={`/research/${card.ticker.toLowerCase()}`} className={styles.researchCard}>
              <div className={styles.cardTop}>
                <span className={styles.cardTicker}>{card.exchange}: {card.ticker}</span>
                <span className={`${styles.cardRating} ${RATING_CLASS[card.rating]}`}>{card.rating.toUpperCase()}</span>
              </div>
              <h2 className={styles.cardCompany}>{card.name}</h2>
              <p className={styles.cardSector}>{card.sector} · {card.industry}</p>
              <p className={styles.cardSummary}>{card.summary}</p>
              <div className={styles.cardFooter}>
                <div>
                  <div>Price Target: <span className={styles.pt}>{card.priceTargetLabel}</span></div>
                  <div style={{ marginTop: '0.2rem' }}>Current Price: <span className={styles.pt}>{card.currentPriceLabel}</span></div>
                </div>
                <span>{card.reportDate}</span>
                <span className={styles.cardArrow}>→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
