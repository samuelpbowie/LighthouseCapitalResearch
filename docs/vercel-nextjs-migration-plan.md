# Vercel / Next.js Migration Plan

Context for future sessions: this repo is currently a hand-rolled static HTML/CSS/JS site
(no build step, no `package.json`) hosted on GitHub Pages. We're migrating to Next.js on
Vercel to get serverless functions (for live price data) and shared components (to kill
the copy-pasted nav/CSS across `index.html`, `equity-research/index.html`, and
`equity-research/okta.html`). Work through the phases below in order; each phase is a
self-contained chunk you can pick up cold in a fresh session. Check off steps as completed.

## Decisions log (why things are the way they are below)

- **Framework: Next.js, App Router.** Chosen over Astro/plain Vite because we need
  serverless functions for live price data *and* a framework for shared components —
  Next.js gives both natively with the least glue code, and it's Vercel's own framework
  (zero-config deploys).
- **Model extraction (`extract_okta_data.py`, reads `Okta Model.xlsm`) stays manual/local.**
  It only changes when the user hand-edits the Excel model — there's no external signal to
  poll, so cron automation doesn't apply. Keep running it locally and committing the output
  JSON, same as today.
- **Live price fetch IS automated**, but only for price/date, not full history. The current
  `fetch_okta_price.py` downloads a full year of OHLCV via `yfinance`, but the page only
  ever reads the *last close* (`MODEL.currentPrice = priceData.close[priceData.close.length - 1]`)
  — the actual price chart on the page is a separate embedded TradingView widget, unrelated
  to this JSON. So the new pipeline only needs **one current price + as-of date per ticker**.
- **Tickers needing live price: OKTA + 5 comps** — CRWD, FTNT, PANW, QLYS, ZS (the full
  comps set from the Excel model), not just OKTA.
- **Data source: `yahoo-finance2` (npm).** `yfinance` is Python-only and won't run in a
  Next.js/Vercel function. `yahoo-finance2` wraps the same unofficial Yahoo endpoints
  `yfinance` itself uses — no API key, no signup, closest like-for-like replacement.
- **Fetch mechanism: Next.js ISR (`revalidate`), not a separate Vercel Cron + KV store.**
  Given the tiny data need (6 quotes, once a day), calling `yahoo-finance2` directly from a
  Server Component/Route Handler with `revalidate: 86400` is simpler than standing up Vercel
  Cron + a persistence layer (KV/Edge Config) or a commit-back-to-git workflow. Revisit only
  if Yahoo's unofficial endpoint proves unreliable enough to need its own caching layer.
- **Snapshot vs. live price are two distinct, permanent concepts — don't conflate them.**
  The Excel model's comps prices are a frozen snapshot ("where the estimates were made") and
  must stay exactly as extracted, with correct as-of dates. Live price is a separate,
  frequently-refreshed value shown alongside it, not a replacement.
- **Confirmed comps snapshot as-of dates** (cross-check against the Excel model; correct the
  source if wrong, otherwise patch in extraction output):
  - OKTA: 3/4/2026
  - CRWD: 3/5/2026
  - FTNT: 2/25/2026
  - PANW: 2/17/2026
  - QLYS: 2/20/2026
  - ZS: 2/26/2026
- **Contact form / newsletter / any backend-auth feature is explicitly out of scope** for
  this migration. Don't add it opportunistically just because serverless functions now exist.
- **Bugs found while reading the current site — fix during the rewrite, not optional:**
  - `index.html`'s `<nav><ul></ul></nav>` is empty — homepage has zero nav links, while every
    subpage links to `../index.html#approach` / `#focus`, anchors that don't exist anywhere
    on the homepage.
  - The homepage stats bar (`.stat-number` / `.stat-label`) is empty markup — renders as
    blank boxes.
  - The "Technology / Special Situations / Emerging Markets" filter buttons on the research
    listing page have no click handlers — decorative only.
  - Nav is hidden entirely on mobile (`nav ul { display: none }`) with no hamburger
    fallback — phone visitors get no navigation except the logo link.
- **Optional additions approved for this migration:** SEO/social meta tags + favicon,
  `sitemap.xml` + `robots.txt`, Vercel Web Analytics. All folded into Phase 4 below.
- **Cosmetic/content changes** are folded into Phase 1 (component rewrite) rather than done
  twice on the static HTML first — avoids redoing the same visual work once on old markup and
  again in React components. Specifics TBD — confirm with user before/during Phase 1.
- **Custom domain**: not yet decided. Defaulting to the free `*.vercel.app` subdomain for
  launch; adding a custom domain later is a DNS-only change in Phase 5, zero code rework.
- **GitHub Pages current config couldn't be verified programmatically** (no `gh` CLI
  available in the dev environment that built this plan). The `.github/workflows` folder is
  empty, so Pages is almost certainly configured via repo Settings → Pages → "Deploy from
  branch", not a GitHub Actions workflow. Confirm this in the GitHub UI before Phase 5.
- **Housekeeping**: `equity-research/data/okta_price.json` is currently deleted locally but
  still tracked in git (uncommitted). It's superseded entirely by the new live-price
  architecture and only its last value was ever used — just `git rm` it cleanly in Phase 1,
  no need to restore it first.

## Phase 0 — Repo hygiene (quick, do first)

- [x] Resolve the uncommitted deletion of `equity-research/data/okta_price.json` —
      `git rm`'d as part of the Phase 1 work (folded in, as planned).
- [x] Cosmetic/copy changes: none requested beyond the bug fixes already listed in the
      decisions log. Phase 1 was a faithful content port, not a redesign.

## Phase 1 — Next.js scaffold + content parity (no new features yet) — DONE

Goal: same site, same content, same visuals — just rebuilt as Next.js components instead of
three copy-pasted HTML files. No live data yet (that's Phase 3).

- [x] `npx create-next-app@latest` (TypeScript, App Router, no `src/` dir). Note: `create-next-app`
      refuses to scaffold directly into a directory whose name has capital letters (npm package
      naming rule) — scaffolded into a temp dir with a lowercase placeholder name, then moved the
      generated config files into the repo root and fixed `package.json`'s `name` field.
- [x] Moved `model_files/Okta Model.xlsm` → `public/model_files/Okta Model.xlsm` (copied, not
      `git mv`'d — see "Known follow-up" below for why). Moved `equity-research/data/okta_data.json`
      → `data/okta_data.json` (repo-root, imported directly by Server Components — no client fetch
      needed). Updated `scripts/extract_okta_data.py`'s `OUTPUT_PATH` to match; script itself
      otherwise unchanged.
- [x] Built shared `components/Nav.tsx` and `components/Footer.tsx`, consolidated all
      `:root` CSS variables into `app/globals.css`.
- [x] Fixed all four bugs from the decisions log:
      homepage now has real nav links (Equity Research dropdown + Contact); the dead
      `#approach`/`#focus` anchors were removed rather than stubbed out (no copy existed for
      those sections); the empty stats bar markup was removed rather than left blank; the
      Technology/Special Situations/Emerging Markets filter buttons are now wired to real
      client-side filtering; a working mobile hamburger menu was added (`components/Nav.tsx`,
      toggles `nav ul.open` via React state).
- [x] Defined the per-ticker content schema in `data/reports.ts` (`Report` interface + `reports[]`
      array). Okta's thesis/bull/bear/meta copy lives there now; adding a second ticker means
      adding one array entry plus running the extraction script for that ticker's model.
- [x] Rebuilt all three pages: `app/page.tsx` (home), `app/research/page.tsx` (listing, with a
      client `ResearchCardGrid` for the filter interactivity), `app/research/[ticker]/page.tsx`
      (dynamic route, statically generated via `generateStaticParams`).
- [x] Re-wired every Chart.js visualization as a typed React client component under
      `components/charts/`: `FinancialModelSection` (KPI table + 5 scenario charts, shared
      toggle state), `FootballField`, `SensitivityTable`, plus static (server-rendered)
      `DcfCards` and `CompsTable`. `TradingViewWidget` ports the embed via `next/script`.
      Chart.js is now an npm dependency (`chart.js@4.4.0`) instead of a CDN `<script>` tag.
- [x] `git rm`'d `equity-research/data/okta_price.json`, plus the three now-superseded static
      HTML files (`index.html`, `equity-research/index.html`, `equity-research/okta.html`) and
      the now-empty `equity-research/` directory.
- [x] Verified via `npm run build` (clean), `npm run lint` (clean), and headless-Chrome
      screenshots of all three routes at desktop + mobile widths, including the DCF cards,
      sensitivity table, comps table, and scenario charts rendering with the exact same numbers
      as the original site.

**Known follow-up — not blocking, but worth doing before Phase 3:**
- `model_files/Okta Model.xlsm` was **copied** (not moved) into `public/model_files/` because
  the file was open in Excel at the time and Windows held a lock preventing rename/delete of the
  original. This means there are now two copies: `model_files/Okta Model.xlsm` (the live working
  file, still what `extract_okta_data.py` reads) and `public/model_files/Okta Model.xlsm` (the
  snapshot served as the "Download Excel Model" button). **The public copy will go stale** the
  next time the model is edited — re-copy it after each edit, or fold the copy into the
  `extract_okta_data.py` run (or a small pre-build script) so it happens automatically.
- The TradingView embed couldn't be fully visually verified in this environment (headless-browser
  iframe loading is unreliable for sandboxed automated screenshots) — the embed code itself is
  an unchanged port of the original, but worth a 10-second look in a real browser before Phase 2.

## Phase 2 — Deploy to Vercel (parallel to GitHub Pages, no cutover yet)

- [ ] Connect the GitHub repo to Vercel (Import Project in the Vercel dashboard).
- [ ] Confirm auto-deploy on push to `main` and preview deployments on PRs/branches.
- [ ] Verify the `*.vercel.app` URL matches local dev exactly.
- [ ] Leave the existing GitHub Pages site untouched and live — no DNS or Pages-settings
      changes yet. Vercel and GitHub Pages can run side by side during the rest of this plan.

## Phase 3 — Live price automation — DONE

(Done out of order, before Phase 2, at the user's request — Phase 2/Vercel deploy is still
pending below.)

- [x] Added `yahoo-finance2` (`^3.15.3`) as a dependency. Note: v3's API changed from the
      plan's assumption — it now requires `new YahooFinance()` instantiation rather than using
      the default export's static methods directly (see `lib/livePrices.ts`).
- [x] `lib/livePrices.ts` exports `getLivePrices(tickers: string[])` — one batched
      `yahooFinance.quote(...)` call for all 6 tickers, used from both `app/research/page.tsx`
      and `app/research/[ticker]/page.tsx`.
- [x] `export const revalidate = 86400;` on both of those routes — confirmed via
      `npm run build` output showing `Revalidate: 1d` on `/research` and `/research/okta`.
- [x] Wrapped in try/catch; returns `null` per ticker (not a thrown error) on any failure, so
      every call site falls back to `modelData.currentPrice` (the Excel snapshot) automatically.
- [x] Wired live price into the three specified places, plus one more the user asked for
      mid-build:
      1. LCR rating header — new "Current Price" stat next to "Price Target", showing
         `$XXX.XX (M/D/YY)` when live, or `(snapshot)` on fallback.
      2. Football field — red dashed line now uses live-or-fallback price (confirmed via
         screenshot: line moved from the old $79.16 snapshot to live $117.81).
      3. Comps table — new "Live Price" row (with a blue "LIVE" badge) below the existing
         snapshot As Of/Price rows for all 6 tickers, clearly distinct.
      4. (Added per user request) Research listing page (`/research`) cards now also show
         "Current Price: $XXX.XX (M/D/YY)" under "Price Target".
- [x] Cross-checked the snapshot "As Of" dates: turned out the Excel cells were already
      correct — `extract_okta_data.py`'s `fmt_date` was just dropping the day
      (`strftime('%b %Y')`). Fixed to `f'{v.month}/{v.day}/{v.year}'`; re-extracted output now
      matches the user-provided list exactly (OKTA 3/4/2026, CRWD 3/5/2026, FTNT 2/25/2026,
      PANW 2/17/2026, QLYS 2/20/2026, ZS 2/26/2026).
- [x] Snapshot vs. live distinction confirmed in the UI: the snapshot "As Of"/"Price" rows in
      the comps table are untouched; live price is visually separated with a "LIVE" badge and
      shown alongside, never overwriting the snapshot value anywhere on the page.

**Found and fixed along the way:** re-running the extraction script (to test the date fix)
surfaced that the Excel model now has 4 historical years (FY2023–FY2026) instead of 3 — the
user confirmed this was an intentional, finished edit. `components/charts/FinancialModelSection.tsx`
had `HIST` hardcoded to `3`; changed to derive it from the data
(`modelData.years.filter(y => !y.endsWith('E')).length`) so the historical/projection split in
the scenario charts and KPI table won't silently break the next time a fiscal year rolls over.

## Phase 4 — SEO / polish additions

- [ ] Per-page metadata (title, description, Open Graph image) via Next.js's Metadata API.
- [ ] Favicon generated from the existing beacon SVG logo.
- [ ] `app/sitemap.ts` and `app/robots.ts` (native Next.js App Router conventions).
- [ ] Enable Vercel Web Analytics (dashboard toggle + one import).

## Phase 5 — Cutover

- [ ] Final smoke test on the Vercel production URL (all charts, tables, live prices,
      downloads working).
- [ ] If a custom domain is wanted: add it in the Vercel dashboard, update DNS.
- [ ] Confirm current GitHub Pages source in repo Settings → Pages (likely "Deploy from
      branch" given the empty `.github/workflows` folder — verify, don't assume), then
      disable it or point it elsewhere.
- [ ] Update any external links (LinkedIn, email signature, etc.) pointing at the old GitHub
      Pages URL — manual follow-up only the user can do.

## Explicitly deferred (not in scope for this migration)

- Contact form, newsletter signup, or any feature requiring auth/a real backend.
