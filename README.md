# Token Radar

A token launch radar: it reads the sealed DefiLlama snapshot of 758
protocols (as of 2026-11-14), finds the protocols that record no token,
and ranks them by an implied launch value, each with a concrete farm plan.

## Value model

Implied value = TVL × category peer multiple (median market-cap / TVL of
the live-token protocols in the same category) × 7-day growth factor ×
listing-age factor × chain-diversity factor. Nothing is hardcoded by
protocol name; the ranking follows from the snapshot's own figures. The
board holds 200 rows: all 40 watchlist protocols plus the 160
highest-scoring pre-token protocols below the $50M floor. A protocol
listed here "records no token" — that is what the snapshot says, never
proof it has none.

## Run it

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input <snapshot.json>
```

Node 22 or later, standard library only. It writes `board.json`,
`dashboard/data.js`, `dashboard/`, `screenshots/` and `dossier.json` to
the output directory. Open `out/dashboard/index.html` in a browser.

## Entry

Built for the make.fun "Build the best token launch radar" bounty
(token-radar-01).
