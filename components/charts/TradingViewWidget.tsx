'use client';

import Script from 'next/script';
import { useEffect, useId } from 'react';

declare global {
  interface Window {
    TradingView?: { widget: new (config: Record<string, unknown>) => unknown };
  }
}

export default function TradingViewWidget({ symbol }: { symbol: string }) {
  const containerId = `tradingview_${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  function mount() {
    if (!window.TradingView) return;
    new window.TradingView.widget({
      symbol,
      interval: 'D',
      range: '12M',
      width: '100%',
      height: 300,
      theme: 'light',
      style: '2',
      locale: 'en',
      toolbar_bg: '#f8fafc',
      hide_top_toolbar: false,
      hide_legend: true,
      save_image: false,
      container_id: containerId,
    });
  }

  useEffect(() => {
    if (window.TradingView) mount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ borderRadius: 8, overflow: 'hidden' }}>
      <div id={containerId} />
      <Script src="https://s3.tradingview.com/tv.js" strategy="afterInteractive" onLoad={mount} />
    </div>
  );
}
