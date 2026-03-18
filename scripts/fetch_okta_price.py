"""
fetch_okta_price.py
Downloads OKTA historical price data via yfinance.
Outputs equity-research/data/okta_price.json
Run from the repo root: python scripts/fetch_okta_price.py
"""

import json
import os
import yfinance as yf
from datetime import datetime

OUTPUT_PATH = os.path.join(os.path.dirname(__file__), '..', 'equity-research', 'data', 'okta_price.json')

from datetime import timedelta
start_date = (datetime.now() - timedelta(days=365)).strftime('%Y-%m-%d')  # 12 months

ticker = yf.Ticker("OKTA")
hist   = ticker.history(start=start_date)

dates  = [d.strftime('%Y-%m-%d') for d in hist.index]
close  = [round(float(v), 2) for v in hist['Close']]
high   = [round(float(v), 2) for v in hist['High']]
low    = [round(float(v), 2) for v in hist['Low']]
volume = [int(v) for v in hist['Volume']]

output = {
    'ticker':      'OKTA',
    'generatedAt': datetime.now().isoformat(),
    'dates':       dates,
    'close':       close,
    'high':        high,
    'low':         low,
    'volume':      volume,
}

os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
with open(OUTPUT_PATH, 'w') as f:
    json.dump(output, f, indent=2)

print(f"Done: {OUTPUT_PATH}")
print(f"  Range: {dates[0]} to {dates[-1]}")
print(f"  Points: {len(dates)}")
print(f"  Latest close: ${close[-1]}")
