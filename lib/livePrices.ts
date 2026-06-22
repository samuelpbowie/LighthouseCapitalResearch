import YahooFinance from 'yahoo-finance2';

export interface LivePrice {
  price: number;
  asOf: string; // ISO timestamp of the quote
}

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

// Fetches a live quote for each ticker. Never throws — a failed or missing
// ticker just comes back as `null` so callers can fall back to the model snapshot.
export async function getLivePrices(tickers: string[]): Promise<Record<string, LivePrice | null>> {
  const result: Record<string, LivePrice | null> = {};
  tickers.forEach((t) => (result[t.toUpperCase()] = null));

  try {
    const quotes = await yf.quote(tickers);
    for (const q of quotes) {
      if (q.symbol && q.regularMarketPrice != null) {
        result[q.symbol.toUpperCase()] = {
          price: q.regularMarketPrice,
          asOf: new Date(q.regularMarketTime ?? Date.now()).toISOString(),
        };
      }
    }
  } catch {
    // Yahoo's unofficial endpoint is flaky — leave everything as null so callers
    // fall back to the model snapshot rather than breaking the page.
  }

  return result;
}
