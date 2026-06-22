'use client';

import { Chart } from 'chart.js/auto';
import { useEffect, useRef, useState } from 'react';
import type { ModelData, ScenarioSeries } from '@/lib/modelTypes';
import { COLORS, fmtE, fmtM, fmtP, hexAlpha } from '@/lib/format';
import styles from '@/app/research/[ticker]/ticker.module.css';

type Mode = 'single' | 'scenarios';

function splitSeries(arr: (number | null)[], joinLine: boolean, hist: number) {
  const histArr = arr.map((v, i) => (i < hist ? v : null));
  const proj = arr.map((v, i) => (i < hist ? null : v));
  if (joinLine) {
    if (arr[hist] != null) histArr[hist] = arr[hist];
    if (arr[hist - 1] != null) proj[hist - 1] = arr[hist - 1];
  }
  return [histArr, proj];
}

export default function FinancialModelSection({ modelData }: { modelData: ModelData }) {
  const [mode, setMode] = useState<Mode>('single');

  // Historical years are the ones without an "E" (estimate) suffix — derived from the
  // data rather than hardcoded, since the model's historical/projection split shifts
  // forward by a year each time a new fiscal year closes.
  const HIST = modelData.years.filter((y) => !y.endsWith('E')).length;

  const revenueRef = useRef<HTMLCanvasElement>(null);
  const ebitdaRef = useRef<HTMLCanvasElement>(null);
  const marginRef = useRef<HTMLCanvasElement>(null);
  const fcfRef = useRef<HTMLCanvasElement>(null);
  const epsRef = useRef<HTMLCanvasElement>(null);
  const chartsRef = useRef<Chart[]>([]);

  useEffect(() => {
    const years = modelData.years;
    chartsRef.current.forEach((c) => c.destroy());
    chartsRef.current = [];

    function barChart(canvas: HTMLCanvasElement | null, arrFull: (number | null)[], scenario: string) {
      if (!canvas) return;
      const [hist, proj] = splitSeries(arrFull, false, HIST);
      const c = new Chart(canvas.getContext('2d')!, {
        type: 'bar',
        data: {
          labels: years,
          datasets: [
            { label: 'Historical', data: hist, backgroundColor: 'rgba(148,163,184,0.7)', borderColor: '#64748b', borderWidth: 1 },
            { label: scenario, data: proj, backgroundColor: hexAlpha(COLORS[scenario as keyof typeof COLORS], 0.75), borderColor: COLORS[scenario as keyof typeof COLORS], borderWidth: 1 },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: true,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { maxRotation: 45 } },
            y: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { callback: (v) => (Math.abs(Number(v)) >= 1000 ? (Number(v) / 1000).toFixed(1) + 'B' : v) } },
          },
        },
      });
      chartsRef.current.push(c);
    }

    function barChartSmall(canvas: HTMLCanvasElement | null, arrFull: (number | null)[], scenario: string) {
      if (!canvas) return;
      const [hist, proj] = splitSeries(arrFull, false, HIST);
      const shortYears = years.map((y) => y.replace('FY20', 'FY'));
      const c = new Chart(canvas.getContext('2d')!, {
        type: 'bar',
        data: {
          labels: shortYears,
          datasets: [
            { label: 'Historical', data: hist, backgroundColor: 'rgba(148,163,184,0.7)', borderColor: '#64748b', borderWidth: 1 },
            { label: scenario, data: proj, backgroundColor: hexAlpha(COLORS[scenario as keyof typeof COLORS], 0.75), borderColor: COLORS[scenario as keyof typeof COLORS], borderWidth: 1 },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: true,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { maxRotation: 0, font: { size: 9 } } },
            y: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { callback: (v) => (Math.abs(Number(v)) >= 1000 ? (Number(v) / 1000).toFixed(1) + 'B' : v) } },
          },
        },
      });
      chartsRef.current.push(c);
    }

    function lineChart(canvas: HTMLCanvasElement | null, arrFull: (number | null)[], scenario: string, isPercent: boolean) {
      if (!canvas) return;
      const [hist, proj] = splitSeries(arrFull, true, HIST);
      const shortYears = years.map((y) => y.replace('FY20', 'FY'));
      const c = new Chart(canvas.getContext('2d')!, {
        type: 'line',
        data: {
          labels: shortYears,
          datasets: [
            { label: 'Historical', data: hist, borderColor: '#94a3b8', backgroundColor: 'transparent', borderWidth: 2, pointRadius: 3, spanGaps: false },
            { label: scenario, data: proj, borderColor: COLORS[scenario as keyof typeof COLORS], backgroundColor: 'transparent', borderWidth: 2, pointRadius: 3, borderDash: [4, 3], spanGaps: false },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: true,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { maxRotation: 0, font: { size: 9 } } },
            y: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { callback: (v) => (isPercent ? v + '%' : v) } },
          },
        },
      });
      chartsRef.current.push(c);
    }

    function scenariosBar(canvas: HTMLCanvasElement | null, metricKey: keyof ModelData['metrics'], wide: boolean) {
      if (!canvas) return;
      const SC = [
        { key: 'Base', label: 'Base', color: COLORS.Base },
        { key: 'Pessimistic', label: 'Bear', color: COLORS.Pessimistic },
        { key: 'Optimistic', label: 'Bull', color: COLORS.Optimistic },
      ] as const;
      const baseArr = modelData.metrics[metricKey]?.Base || [];
      const datasets = [
        { label: 'Historical', data: baseArr.map((v, i) => (i < HIST ? v : null)), backgroundColor: 'rgba(148,163,184,0.7)', borderColor: '#64748b', borderWidth: 1 },
        ...SC.map((s) => ({
          label: s.label,
          data: (modelData.metrics[metricKey]?.[s.key as keyof ScenarioSeries] || []).map((v, i) => (i < HIST ? null : v)),
          backgroundColor: hexAlpha(s.color, 0.75),
          borderColor: s.color,
          borderWidth: 1,
        })),
      ];
      const chartLabels = wide ? years : years.map((y) => y.replace('FY20', 'FY'));
      const c = new Chart(canvas.getContext('2d')!, {
        type: 'bar',
        data: { labels: chartLabels, datasets },
        options: {
          responsive: true, maintainAspectRatio: true,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: wide ? { maxRotation: 45 } : { maxRotation: 0, font: { size: 9 } } },
            y: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { callback: (v) => (Math.abs(Number(v)) >= 1000 ? (Number(v) / 1000).toFixed(1) + 'B' : v) } },
          },
        },
      });
      chartsRef.current.push(c);
    }

    function scenariosLine(canvas: HTMLCanvasElement | null, metricKey: keyof ModelData['metrics']) {
      if (!canvas) return;
      const SC = [
        { key: 'Base', label: 'Base', color: COLORS.Base },
        { key: 'Pessimistic', label: 'Bear', color: COLORS.Pessimistic },
        { key: 'Optimistic', label: 'Bull', color: COLORS.Optimistic },
      ] as const;
      const baseArr = modelData.metrics[metricKey]?.Base || [];
      const histData = baseArr.map((v, i) => (i < HIST ? v : null));
      if (baseArr[HIST] != null) histData[HIST] = baseArr[HIST];
      const histDs = { label: 'Historical', data: histData, borderColor: '#94a3b8', backgroundColor: 'transparent', borderWidth: 2, pointRadius: 3, spanGaps: false };
      const projDs = SC.map((s) => {
        const arr = modelData.metrics[metricKey]?.[s.key as keyof ScenarioSeries] || [];
        const proj = arr.map((v, i) => (i < HIST ? null : v));
        if (arr[HIST - 1] != null) proj[HIST - 1] = arr[HIST - 1];
        return { label: s.label, data: proj, borderColor: s.color, backgroundColor: 'transparent', borderWidth: 2, pointRadius: 3, borderDash: [4, 3] as [number, number], spanGaps: false };
      });
      const shortYears = years.map((y) => y.replace('FY20', 'FY'));
      const c = new Chart(canvas.getContext('2d')!, {
        type: 'line',
        data: { labels: shortYears, datasets: [histDs, ...projDs] },
        options: {
          responsive: true, maintainAspectRatio: true,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { maxRotation: 0, font: { size: 9 } } },
            y: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { callback: (v) => v + '%' } },
          },
        },
      });
      chartsRef.current.push(c);
    }

    if (mode === 'scenarios') {
      scenariosBar(revenueRef.current, 'Revenue', true);
      scenariosBar(ebitdaRef.current, 'EBITDA', false);
      scenariosLine(marginRef.current, 'EBITDAMargin');
      scenariosBar(fcfRef.current, 'FCF', false);
      scenariosBar(epsRef.current, 'EPS', false);
    } else {
      const scenario = 'Weighted Average';
      barChart(revenueRef.current, modelData.metrics.Revenue[scenario] || [], scenario);
      barChartSmall(ebitdaRef.current, modelData.metrics.EBITDA[scenario] || [], scenario);
      lineChart(marginRef.current, modelData.metrics.EBITDAMargin[scenario] || [], scenario, true);
      barChartSmall(fcfRef.current, modelData.metrics.FCF[scenario] || [], scenario);
      barChartSmall(epsRef.current, modelData.metrics.EPS[scenario] || [], scenario);
    }

    return () => {
      chartsRef.current.forEach((c) => c.destroy());
      chartsRef.current = [];
    };
  }, [mode, modelData, HIST]);

  // KPI table — always Weighted Average, regardless of toggle (matches original behavior)
  const scenario = 'Weighted Average';
  const rows = [
    { label: 'Revenue ($M)', vals: modelData.metrics.Revenue[scenario], fmt: fmtM },
    { label: 'Revenue Growth', vals: modelData.metrics.RevenueCagr[scenario], fmt: fmtP },
    { label: 'Gross Profit ($M)', vals: modelData.incomeStatement.GrossProfit[scenario], fmt: fmtM },
    { label: 'Gross Margin', vals: modelData.incomeStatement.GrossMargin[scenario], fmt: (v: number | null) => (v == null ? '—' : v.toFixed(1) + '%') },
    { label: 'EBITDA ($M)', vals: modelData.metrics.EBITDA[scenario], fmt: fmtM },
    { label: 'EBITDA Margin', vals: modelData.metrics.EBITDAMargin[scenario], fmt: fmtP },
    { label: 'FCF ($M)', vals: modelData.metrics.FCF[scenario], fmt: fmtM },
    { label: 'FCF Margin', vals: modelData.metrics.FCFMargin[scenario], fmt: fmtP },
    { label: 'EPS (Basic)', vals: modelData.metrics.EPS[scenario], fmt: fmtE },
  ];

  const gen = new Date(modelData.generatedAt);
  const kpiNote = `E = Lighthouse Capital Research estimates (${scenario} scenario). Model data as of ${gen.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.`;
  const generatedLabel = `(data from ${gen.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})`;

  return (
    <>
      <div className={styles.pageCol}>
        <div className={styles.section} id="model-section">
          <h2 className={styles.sectionTitle}>
            Financial Model{' '}
            <span style={{ fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 400, marginLeft: '0.5rem', fontStyle: 'italic' }}>{generatedLabel}</span>
          </h2>
          <div className={styles.scenarioBar}>
            <label>Scenario:</label>
            <button
              className={`${styles.scenarioBtn} ${mode === 'single' ? styles.scenarioBtnActiveWA : ''}`}
              onClick={() => setMode('single')}
            >
              Wtd Avg
            </button>
            <button
              className={`${styles.scenarioBtn} ${mode === 'scenarios' ? styles.scenarioBtnActiveScenarios : ''}`}
              onClick={() => setMode('scenarios')}
            >
              Scenarios
            </button>
          </div>
          <h3 style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text)', marginBottom: '1rem' }}>
            Key Metrics — <span>Weighted Average</span>
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table className={styles.kpiTable}>
              <thead>
                <tr>
                  <th>Metric</th>
                  {modelData.years.map((y, i) => (
                    <th key={y} className={i >= HIST ? styles.proj : ''}>{y}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.label}>
                    <td>{row.label}</td>
                    {(row.vals || []).map((v, i) => (
                      <td key={i} className={i >= HIST ? styles.projVal : ''}>{row.fmt(v)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={styles.tableNote}>{kpiNote}</p>
        </div>
      </div>

      <div className={styles.pageCol}>
        <div className={styles.section} id="charts-section" style={{ minWidth: 0, overflow: 'hidden' }}>
          <h2 className={styles.sectionTitle}>Scenario Charts</h2>
          <div className={styles.chartGrid}>
            <div className={`${styles.chartCard} ${styles.chartCardWide}`}><h4>Revenue ($M)</h4><canvas ref={revenueRef} /></div>
            <div className={styles.chartCard}><h4>EBITDA ($M)</h4><canvas ref={ebitdaRef} /></div>
            <div className={styles.chartCard}><h4>EBITDA Margin (%)</h4><canvas ref={marginRef} /></div>
            <div className={styles.chartCard}><h4>Free Cash Flow ($M)</h4><canvas ref={fcfRef} /></div>
            <div className={styles.chartCard}><h4>EPS (Basic)</h4><canvas ref={epsRef} /></div>
          </div>
        </div>
      </div>
    </>
  );
}
