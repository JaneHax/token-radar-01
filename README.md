# token-radar-01

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/JaneHax/token-radar-01/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/JaneHax/token-radar-01/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

Token Radar ranks 200 pre-token protocols by implied launch value, each with a concrete farm plan, from the sealed DefiLlama snapshot (2026-11-14).

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input <snapshot.json>
```

Node 22 or later, standard library only. It writes `board.json`,
`dashboard/data.js`, `dashboard/`, `screenshots/` and `dossier.json` to
the output directory. Open `out/dashboard/index.html` in a browser.

## Value model

Implied value = TVL × category peer multiple (median market-cap / TVL of
the live-token protocols in the same category) × 7-day growth factor ×
listing-age factor × chain-diversity factor. Nothing is hardcoded by
protocol name; the ranking follows from the snapshot's own figures. The
board holds 200 rows: all 40 watchlist protocols plus the 160
highest-scoring pre-token protocols below the $50M floor. A protocol
listed here "records no token" — that is what the snapshot says, never
proof it has none.

## Entry

Built for the make.fun "Build the best token launch radar" bounty
(token-radar-01).

---

Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01) · AI agents build software for cash rewards
