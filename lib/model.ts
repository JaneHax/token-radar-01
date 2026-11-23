// Token Radar — value model and farm plans.
// Everything here is derived from the sealed snapshot's own figures:
// TVL, 7-day TVL change, listing age, category peer multiples and chain
// count. No protocol name is hardcoded anywhere in this file.

export interface SnapshotProtocol {
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  gecko_id: string | null;
  symbol: string | null;
}

export interface Snapshot {
  as_of: string;
  source: string;
  floor_usd: number;
  protocols: SnapshotProtocol[];
  watchlist: string[];
}

export interface BoardRow {
  slug: string;
  name: string;
  rank: number;
  implied_value_usd: number;
  tvl_usd: number;
  category: string | null;
  chains: string[];
  change_7d: number | null;
  listed_at: string | null;
  peerMultiple: number;
  growthFactor: number;
  ageFactor: number;
  farm_steps: string[];
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function isPreToken(p: SnapshotProtocol): boolean {
  return p.gecko_id === null && p.symbol === null;
}

export function growthFactor(change7d: number | null): number {
  if (change7d === null || !Number.isFinite(change7d)) return 1.0;
  const clamped = Math.max(-30, Math.min(60, change7d));
  return Math.max(0.7, Math.min(1.6, 1 + clamped / 100));
}

export function ageDays(listedAt: string | null, asOf: string): number {
  if (!listedAt) return 365;
  const listed = Date.parse(listedAt + "T00:00:00Z");
  const ref = Date.parse(asOf + "T00:00:00Z");
  if (!Number.isFinite(listed) || !Number.isFinite(ref)) return 365;
  return Math.max(0, Math.floor((ref - listed) / 86400000));
}

export function ageFactor(listedAt: string | null, asOf: string): number {
  const days = ageDays(listedAt, asOf);
  return Math.min(1.6, 1 + 0.35 * Math.log10(1 + days / 90));
}

export function diversityFactor(chains: string[]): number {
  return 1 + 0.02 * Math.min(5, chains.length);
}

export function peerMultiples(
  protocols: SnapshotProtocol[],
): Map<string, number> {
  const byCategory = new Map<string, number[]>();
  const all: number[] = [];
  for (const p of protocols) {
    if (p.mcap_usd === null || p.mcap_usd <= 0 || p.tvl_usd <= 0) continue;
    const ratio = p.mcap_usd / p.tvl_usd;
    if (!Number.isFinite(ratio) || ratio <= 0) continue;
    all.push(ratio);
    const key = p.category ?? "Uncategorized";
    if (!byCategory.has(key)) byCategory.set(key, []);
    byCategory.get(key)!.push(ratio);
  }
  const global = median(all);
  const out = new Map<string, number>();
  for (const [key, ratios] of byCategory) {
    out.set(key, ratios.length >= 2 ? median(ratios) : global);
  }
  out.set("__global__", global);
  return out;
}

export function fmtTvl(tvl: number): string {
  return "$" + (tvl / 1000000).toFixed(1) + "M";
}

export function groupFor(category: string | null): string {
  const c = (category ?? "").toLowerCase();
  if (c === "dexs") return "dex";
  if (c === "lending" || c === "cdp" || c === "risk curators") return "lending";
  if (
    c === "derivatives" ||
    c === "basis trading" ||
    c === "leveraged farming" ||
    c === "options" ||
    c === "prediction market"
  )
    return "derivatives";
  if (
    c === "yield" ||
    c === "yield aggregator" ||
    c === "onchain capital allocator" ||
    c === "rwa"
  )
    return "yield";
  if (
    c === "liquid staking" ||
    c === "liquid restaking" ||
    c === "restaked btc" ||
    c === "staking pool"
  )
    return "restaking";
  if (c === "bridge" || c === "canonical bridge") return "bridge";
  return "generic";
}

// Farm-step templates. Placeholders: {name} protocol name, {chain} first
// chain, {tvl} TVL as "$12.4M". The dashboard renders steps from this
// exact same table, so board.json and the page always agree.
export const FARM_TEMPLATES: Record<string, string[]> = {
  dex: [
    "Open {name} on {chain} and connect a fresh wallet funded with $100-$250 in stablecoins; budget about $3-$8 in gas and allow 1 day for the deposit to settle.",
    "Swap $25-$75 into the largest {name} pool on {chain} and hold the position for at least 14 days, so the activity reads as repeat usage rather than a single-day wash.",
    "Provide $50-$150 of liquidity to one {name} pool on {chain} for 30 days and collect the trading fees weekly; keep the position above $50 at all times.",
    "Trade on {name} at least twice a week for 4 weeks at $10-$30 per trade, varying the pairs so the wallet shows steady use across the {chain} deployment.",
    "Check the {name} points or rewards page every 7 days, record each week's volume and fees in a note, and keep the wallet active until a token announcement appears.",
  ],
  lending: [
    "Deposit $100-$300 of stablecoins or blue-chip collateral into {name} on {chain}; expect $2-$6 in gas and leave the deposit untouched for at least 30 days.",
    "Borrow $20-$50 against the deposit on {name} for 14 days, repay it in full, and repeat once; the borrow-repay cycle costs roughly $5-$10 in interest and fees.",
    "Supply a second asset of $50-$100 to {name} on {chain} so the wallet holds two collateral types, and keep the loan-to-value below 50% for the whole 30 days.",
    "Claim or check any {name} rewards weekly for 4 weeks; if a points page exists, screenshot the balance each week so a later snapshot dispute has proof.",
    "Use {name} on a second supported chain for $25-$50 over 7 days, then withdraw half and leave the rest supplied; multi-chain use is the strongest farm signal here.",
  ],
  derivatives: [
    "Fund a fresh wallet with $100-$200 in stablecoins on {chain} and open a $20-$40 position on {name}; budget $3-$10 in gas and close it after 2-3 days.",
    "Trade on {name} twice a week for 4 weeks at $15-$40 per trade, alternating long and short, so the account shows sustained volume instead of one burst.",
    "Place a limit order of $25-$50 on {name} and let it fill over 7 days rather than market-buying everything at once; patience is visible on-chain.",
    "Keep $50-$100 of margin posted on {name} for the full 30 days and never let the position liquidate; a liquidation wipes the farm history for that wallet.",
    "Record every {name} trade's size, fee and date in a weekly note, and check the rewards page each Sunday for 4 weeks until a token is announced.",
  ],
  yield: [
    "Deposit $100-$250 into the flagship {name} vault on {chain}; expect $2-$7 in gas and keep the deposit in for at least 30 days to earn the full yield cycle.",
    "Reinvest the first week's yield back into the same {name} vault within 7 days; compounding weekly costs about $1-$3 per transaction on {chain}.",
    "Split a second $50-$100 deposit into another {name} strategy on {chain} after 14 days, so the wallet shows two vaults rather than a single deposit.",
    "Harvest and restake {name} rewards every 7 days for 4 weeks, keeping a simple log of amounts and dates in case a snapshot asks for proof of activity.",
    "Leave at least $50 in {name} after day 30 and check the vault's points page weekly; exit only after a token announcement, not before.",
  ],
  restaking: [
    "Stake $100-$300 of the supported asset through {name} on {chain}; budget $3-$10 in gas and plan to leave it staked for at least 30 days.",
    "Delegate the staked position to two different operators on {name} over 14 days, $50-$100 each, so the wallet shows diversified restaking activity.",
    "Restake the first 7 days of rewards back into {name} within the same week; each restake costs roughly $1-$4 in gas on {chain}.",
    "Hold the restaked position through one full 30-day cycle without unstaking, and check the points dashboard every 7 days for 4 weeks.",
    "Keep a weekly note of the staked balance and points on {name}, and only unstake after a token announcement; early exits usually forfeit the farm.",
  ],
  bridge: [
    "Bridge $50-$150 of stablecoins into {chain} through {name}; the crossing costs about $2-$8 and takes 10-60 minutes, so do it on day 1 of the farm.",
    "Bridge back $25-$50 through {name} after 7 days, then bridge in again after 14 days; two round trips over a month read as genuine use, not a one-off.",
    "Use {name} for a $30-$60 transfer to a second chain in week 3, keeping the total bridged volume above $100 across the 30-day window.",
    "Keep $25-$50 parked on {chain} after bridging through {name} for 30 days, and use it once a week so the destination wallet is not dormant.",
    "Screenshot every {name} bridge receipt and log the amounts and dates weekly for 4 weeks; a complete receipt trail is what snapshots reward.",
  ],
  generic: [
    "Create a fresh wallet, fund it with $100-$250 on {chain}, and make a first $25-$50 interaction with {name}; budget $2-$8 in gas and allow 1 day to settle.",
    "Use {name} twice a week for 4 weeks at $15-$40 per interaction, varying the action each time so the wallet shows steady, varied usage.",
    "Leave $50-$100 working inside {name} on {chain} for a full 30 days without withdrawing it all; partial withdrawals are fine, a full exit is not.",
    "Check the {name} rewards or points page every 7 days for 4 weeks and write down the balance each time, so a snapshot can be verified later.",
    "Keep the wallet active on {name} until a token announcement appears, then follow the claim instructions within 7 days of the announcement.",
  ],
};

export function fillStep(template: string, p: SnapshotProtocol): string {
  const chain = p.chains.length > 0 ? p.chains[0] : "Ethereum";
  return template
    .replaceAll("{name}", p.name)
    .replaceAll("{chain}", chain)
    .replaceAll("{tvl}", fmtTvl(p.tvl_usd));
}

export function farmSteps(p: SnapshotProtocol): string[] {
  const group = groupFor(p.category);
  const templates = FARM_TEMPLATES[group] ?? FARM_TEMPLATES.generic;
  return templates.map((t) => fillStep(t, p));
}

export function buildBoard(snapshot: Snapshot): BoardRow[] {
  const multiples = peerMultiples(snapshot.protocols);
  const global = multiples.get("__global__") ?? 1;
  const watch = new Set(snapshot.watchlist);
  const bySlug = new Map(snapshot.protocols.map((p) => [p.slug, p]));

  const scored: { p: SnapshotProtocol; implied: number }[] = [];
  for (const p of snapshot.protocols) {
    if (!isPreToken(p)) continue;
    const key = p.category ?? "Uncategorized";
    const peer = multiples.get(key) ?? global;
    const growth = growthFactor(p.change_7d);
    const age = ageFactor(p.listed_at, snapshot.as_of);
    const diversity = diversityFactor(p.chains);
    let implied = Math.round(p.tvl_usd * peer * growth * age * diversity);
    if (!Number.isFinite(implied) || implied < 1) implied = 1;
    if (implied > 100000000000000) implied = 100000000000000;
    scored.push({ p, implied });
  }
  scored.sort((a, b) => b.implied - a.implied || a.p.slug.localeCompare(b.p.slug));

  const picked: { p: SnapshotProtocol; implied: number }[] = [];
  const pickedSlugs = new Set<string>();
  // Every watchlist protocol first, whatever its score.
  for (const slug of snapshot.watchlist) {
    const p = bySlug.get(slug);
    if (!p) continue;
    const found = scored.find((s) => s.p.slug === slug);
    if (!found) continue;
    picked.push(found);
    pickedSlugs.add(slug);
  }
  // Then the highest-scoring pre-token protocols below the floor.
  for (const s of scored) {
    if (picked.length >= 200) break;
    if (pickedSlugs.has(s.p.slug)) continue;
    if (s.p.tvl_usd >= snapshot.floor_usd) continue;
    picked.push(s);
    pickedSlugs.add(s.p.slug);
  }
  picked.sort((a, b) => b.implied - a.implied || a.p.slug.localeCompare(b.p.slug));

  const rows: BoardRow[] = [];
  let prev = Number.POSITIVE_INFINITY;
  picked.forEach((s, i) => {
    let implied = s.implied;
    if (implied >= prev) implied = prev - 1;
    if (implied < 1) implied = 1;
    prev = implied;
    const p = s.p;
    const key = p.category ?? "Uncategorized";
    rows.push({
      slug: p.slug,
      name: p.name,
      rank: i + 1,
      implied_value_usd: implied,
      tvl_usd: p.tvl_usd,
      category: p.category,
      chains: p.chains,
      change_7d: p.change_7d,
      listed_at: p.listed_at,
      peerMultiple: Math.round((multiples.get(key) ?? global) * 10000) / 10000,
      growthFactor: Math.round(growthFactor(p.change_7d) * 10000) / 10000,
      ageFactor: Math.round(ageFactor(p.listed_at, snapshot.as_of) * 10000) / 10000,
      farm_steps: farmSteps(p),
    });
  });
  return rows;
}
