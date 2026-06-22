'use client';

import { Chart, type ChartDataset, type Plugin } from 'chart.js/auto';
import { useEffect, useRef } from 'react';
import { hexAlpha } from '@/lib/format';
import styles from '@/app/research/[ticker]/ticker.module.css';

export interface FootballFieldItem {
  label: string;
  dataType: string;
  low: number | null;
  avg: number | null;
  high: number | null;
}

const FF_COLORS: Record<string, string> = {
  Estimate: '#1e293b',
  'DCF Implied Share Price': '#1a56db',
  '52-Week Trading Range': '#64748b',
  'Analyst Forecasts': '#d97706',
  'Revenue Comparables': '#0d9488',
  'EBITDA Comparables': '#7c3aed',
  'Forward PE (2027)': '#6366f1',
  'Forward PE (2028)': '#818cf8',
};

export default function FootballField({ items, currentPrice }: { items: FootballFieldItem[]; currentPrice: number | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const labels = items.map((d) => (d.label === 'DCF Implied Share Price' ? 'DCF' : d.label));
    const ranges = items.map((d) => [d.low ?? 0, d.high ?? 0]) as unknown as ChartDataset<'bar'>['data'];
    const bgColors = items.map((d) => hexAlpha(FF_COLORS[d.label] || '#94a3b8', 0.65));
    const brdColors = items.map((d) => FF_COLORS[d.label] || '#94a3b8');

    const ffPlugin: Plugin<'bar'> = {
      id: 'ffOverlay',
      afterDraw(chart) {
        const ctx = chart.ctx;
        const xScale = chart.scales.x;
        const yScale = chart.scales.y;
        const ca = chart.chartArea;

        if (currentPrice != null) {
          const x = xScale.getPixelForValue(currentPrice);
          ctx.save();
          ctx.beginPath();
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 4]);
          ctx.moveTo(x, ca.top);
          ctx.lineTo(x, ca.bottom);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = '#ef4444';
          ctx.font = 'bold 10px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(`$${currentPrice.toFixed(2)}`, x, ca.top - 6);
          ctx.restore();
        }

        items.forEach((item, i) => {
          if (item.avg == null) return;
          const x = xScale.getPixelForValue(item.avg);
          const y = yScale.getPixelForValue(i);
          const s = item.label === 'Estimate' ? 7 : 5;
          const c = FF_COLORS[item.label] || '#1e293b';
          ctx.save();
          ctx.fillStyle = c;
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x, y - s);
          ctx.lineTo(x + s, y);
          ctx.lineTo(x, y + s);
          ctx.lineTo(x - s, y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        });
      },
    };

    chartRef.current?.destroy();
    chartRef.current = new Chart(canvasRef.current.getContext('2d')!, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            data: ranges,
            backgroundColor: bgColors,
            borderColor: brdColors,
            borderWidth: 1.5,
            borderRadius: 3,
            borderSkipped: false,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 20 } },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (ctx) => ctx[0].label,
              label: (ctx) => {
                const item = items[ctx.dataIndex];
                return [
                  ` Low:  $${item.low != null ? item.low.toFixed(1) : '—'}`,
                  ` Mid:  $${item.avg != null ? item.avg.toFixed(1) : '—'}`,
                  ` High: $${item.high != null ? item.high.toFixed(1) : '—'}`,
                ];
              },
            },
          },
        },
        scales: {
          x: {
            min: 0,
            ticks: { callback: (v) => `$${v}`, font: { size: 11 } },
            grid: { color: 'rgba(0,0,0,0.05)' },
            title: { display: true, text: 'Implied Share Price (USD)', font: { size: 11 } },
          },
          y: {
            grid: { display: false },
            ticks: {
              font: (ctx) => (ctx.tick && ctx.tick.label === 'Estimate' ? { size: 11, weight: 'bold' } : { size: 11 }),
            },
          },
        },
      },
      plugins: [ffPlugin],
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [items, currentPrice]);

  return (
    <div>
      <p style={{ fontFamily: 'Arial,sans-serif', fontSize: '0.82rem', color: 'var(--muted)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
        Implied share price ranges across valuation methodologies. Bars show the Low–High range; ◆ marks the mid. Dashed line = current stock price.
      </p>
      <div style={{ position: 'relative', height: 280 }}>
        <canvas ref={canvasRef} />
      </div>
      <div className={styles.ffLegend}>
        {items.map((item) => {
          const c = FF_COLORS[item.label] || '#94a3b8';
          const lbl = item.label === 'DCF Implied Share Price' ? 'DCF' : item.label;
          return (
            <span className={styles.ffLegendItem} key={item.label}>
              <span className={styles.ffSwatch} style={{ background: hexAlpha(c, 0.7), border: `1px solid ${c}` }} />
              {lbl}
            </span>
          );
        })}
      </div>
      <p className={styles.ffNote}>Estimate is a weighted blend: 50% DCF · 25% EBITDA Comps · 15% Forward PE (2027) · 10% Revenue Comps. Revenue Comps range reflects wide peer EV/Revenue dispersion.</p>
    </div>
  );
}
