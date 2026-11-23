// Token Radar dashboard. Renders window.RADAR_DATA, routes by hash:
// #/board (default), #/protocol/<slug>, #/filter?category=<name>.
// Farm steps use the same templates as lib/model.ts, so the page and
// board.json always show the same plan for a protocol.
(function () {
  var D = window.RADAR_DATA || { as_of: "", rows: [] };
  var ROWS = D.rows.map(function (r) {
    return { slug: r[0], name: r[1], category: r[2], chains: r[3], tvl: r[4],
      chg: r[5], listed: r[6], implied: r[7], peer: r[8], growth: r[9], age: r[10] };
  });
  var BY_SLUG = {};
  ROWS.forEach(function (r) { BY_SLUG[r.slug] = r; });

  var TEMPLATES = {
    dex: [
      "Open {name} on {chain} and connect a fresh wallet funded with $100-$250 in stablecoins; budget about $3-$8 in gas and allow 1 day for the deposit to settle.",
      "Swap $25-$75 into the largest {name} pool on {chain} and hold the position for at least 14 days, so the activity reads as repeat usage rather than a single-day wash.",
      "Provide $50-$150 of liquidity to one {name} pool on {chain} for 30 days and collect the trading fees weekly; keep the position above $50 at all times.",
      "Trade on {name} at least twice a week for 4 weeks at $10-$30 per trade, varying the pairs so the wallet shows steady use across the {chain} deployment.",
      "Check the {name} points or rewards page every 7 days, record each week's volume and fees in a note, and keep the wallet active until a token announcement appears."
    ],
    lending: [
      "Deposit $100-$300 of stablecoins or blue-chip collateral into {name} on {chain}; expect $2-$6 in gas and leave the deposit untouched for at least 30 days.",
      "Borrow $20-$50 against the deposit on {name} for 14 days, repay it in full, and repeat once; the borrow-repay cycle costs roughly $5-$10 in interest and fees.",
      "Supply a second asset of $50-$100 to {name} on {chain} so the wallet holds two collateral types, and keep the loan-to-value below 50% for the whole 30 days.",
      "Claim or check any {name} rewards weekly for 4 weeks; if a points page exists, screenshot the balance each week so a later snapshot dispute has proof.",
      "Use {name} on a second supported chain for $25-$50 over 7 days, then withdraw half and leave the rest supplied; multi-chain use is the strongest farm signal here."
    ],
    derivatives: [
      "Fund a fresh wallet with $100-$200 in stablecoins on {chain} and open a $20-$40 position on {name}; budget $3-$10 in gas and close it after 2-3 days.",
      "Trade on {name} twice a week for 4 weeks at $15-$40 per trade, alternating long and short, so the account shows sustained volume instead of one burst.",
      "Place a limit order of $25-$50 on {name} and let it fill over 7 days rather than market-buying everything at once; patience is visible on-chain.",
      "Keep $50-$100 of margin posted on {name} for the full 30 days and never let the position liquidate; a liquidation wipes the farm history for that wallet.",
      "Record every {name} trade's size, fee and date in a weekly note, and check the rewards page each Sunday for 4 weeks until a token is announced."
    ],
    yield: [
      "Deposit $100-$250 into the flagship {name} vault on {chain}; expect $2-$7 in gas and keep the deposit in for at least 30 days to earn the full yield cycle.",
      "Reinvest the first week's yield back into the same {name} vault within 7 days; compounding weekly costs about $1-$3 per transaction on {chain}.",
      "Split a second $50-$100 deposit into another {name} strategy on {chain} after 14 days, so the wallet shows two vaults rather than a single deposit.",
      "Harvest and restake {name} rewards every 7 days for 4 weeks, keeping a simple log of amounts and dates in case a snapshot asks for proof of activity.",
      "Leave at least $50 in {name} after day 30 and check the vault's points page weekly; exit only after a token announcement, not before."
    ],
    restaking: [
      "Stake $100-$300 of the supported asset through {name} on {chain}; budget $3-$10 in gas and plan to leave it staked for at least 30 days.",
      "Delegate the staked position to two different operators on {name} over 14 days, $50-$100 each, so the wallet shows diversified restaking activity.",
      "Restake the first 7 days of rewards back into {name} within the same week; each restake costs roughly $1-$4 in gas on {chain}.",
      "Hold the restaked position through one full 30-day cycle without unstaking, and check the points dashboard every 7 days for 4 weeks.",
      "Keep a weekly note of the staked balance and points on {name}, and only unstake after a token announcement; early exits usually forfeit the farm."
    ],
    bridge: [
      "Bridge $50-$150 of stablecoins into {chain} through {name}; the crossing costs about $2-$8 and takes 10-60 minutes, so do it on day 1 of the farm.",
      "Bridge back $25-$50 through {name} after 7 days, then bridge in again after 14 days; two round trips over a month read as genuine use, not a one-off.",
      "Use {name} for a $30-$60 transfer to a second chain in week 3, keeping the total bridged volume above $100 across the 30-day window.",
      "Keep $25-$50 parked on {chain} after bridging through {name} for 30 days, and use it once a week so the destination wallet is not dormant.",
      "Screenshot every {name} bridge receipt and log the amounts and dates weekly for 4 weeks; a complete receipt trail is what snapshots reward."
    ],
    generic: [
      "Create a fresh wallet, fund it with $100-$250 on {chain}, and make a first $25-$50 interaction with {name}; budget $2-$8 in gas and allow 1 day to settle.",
      "Use {name} twice a week for 4 weeks at $15-$40 per interaction, varying the action each time so the wallet shows steady, varied usage.",
      "Leave $50-$100 working inside {name} on {chain} for a full 30 days without withdrawing it all; partial withdrawals are fine, a full exit is not.",
      "Check the {name} rewards or points page every 7 days for 4 weeks and write down the balance each time, so a snapshot can be verified later.",
      "Keep the wallet active on {name} until a token announcement appears, then follow the claim instructions within 7 days of the announcement."
    ]
  };

  function groupFor(cat) {
    var c = (cat || "").toLowerCase();
    if (c === "dexs") return "dex";
    if (c === "lending" || c === "cdp" || c === "risk curators") return "lending";
    if (c === "derivatives" || c === "basis trading" || c === "leveraged farming" || c === "options" || c === "prediction market") return "derivatives";
    if (c === "yield" || c === "yield aggregator" || c === "onchain capital allocator" || c === "rwa") return "yield";
    if (c === "liquid staking" || c === "liquid restaking" || c === "restaked btc" || c === "staking pool") return "restaking";
    if (c === "bridge" || c === "canonical bridge") return "bridge";
    return "generic";
  }
  function fmtTvl(tvl) { return "$" + (tvl / 1000000).toFixed(1) + "M"; }
  function renderSteps(row) {
    var list = TEMPLATES[groupFor(row.category)] || TEMPLATES.generic;
    var chain = row.chains && row.chains.length ? row.chains[0] : "Ethereum";
    return list.map(function (t) {
      return t.split("{name}").join(row.name).split("{chain}").join(chain).split("{tvl}").join(fmtTvl(row.tvl));
    });
  }
  window.RADAR_FARM = { templates: TEMPLATES, groupFor: groupFor, renderSteps: renderSteps };

  function fmtUsd(n) {
    if (n >= 1e9) return "$" + (n / 1e9).toFixed(2) + "B";
    if (n >= 1e6) return "$" + (n / 1e6).toFixed(1) + "M";
    return "$" + Math.round(n).toLocaleString("en-US");
  }
  function fmtChg(c) {
    if (c === null || c === undefined) return "—";
    var cls = c >= 0 ? "up" : "down";
    return '<span class="' + cls + '">' + (c >= 0 ? "+" : "") + c.toFixed(1) + "%</span>";
  }
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function ageDays(row) {
    if (!row.listed) return 365;
    return Math.max(0, Math.floor((Date.parse(D.as_of + "T00:00:00Z") - Date.parse(row.listed + "T00:00:00Z")) / 86400000));
  }

  var state = { q: "", cat: "", chain: "", sort: "implied" };
  var view;

  function filtered() {
    var rows = ROWS.filter(function (r) {
      if (state.cat && r.category !== state.cat) return false;
      if (state.chain && (!r.chains || r.chains.indexOf(state.chain) < 0)) return false;
      if (state.q) {
        var q = state.q.toLowerCase();
        if (r.name.toLowerCase().indexOf(q) < 0 && r.slug.toLowerCase().indexOf(q) < 0) return false;
      }
      return true;
    });
    var by = {
      implied: function (a, b) { return b.implied - a.implied; },
      tvl: function (a, b) { return b.tvl - a.tvl; },
      chg: function (a, b) { return (b.chg === null ? -999 : b.chg) - (a.chg === null ? -999 : a.chg); },
      age: function (a, b) { return ageDays(b) - ageDays(a); }
    }[state.sort] || function (a, b) { return b.implied - a.implied; };
    return rows.slice().sort(by);
  }

  function boardHtml(rows) {
    if (!rows.length) return '<div class="empty">No protocols match this filter.</div>';
    var html = '<table><thead><tr><th>#</th><th>Protocol</th><th>Category</th><th>Chains</th><th class="num">TVL</th><th class="num">7d</th><th class="num">Implied value</th></tr></thead><tbody>';
    rows.forEach(function (r, i) {
      html += "<tr><td>" + (i + 1) + "</td><td><a href=\"#/protocol/" + esc(r.slug) + "\">" + esc(r.name) + "</a><br><span style=\"color:var(--mut);font-size:12px\">" + esc(r.slug) + "</span></td><td>" + esc(r.category || "—") + "</td><td>" +
        (r.chains || []).map(function (c) { return '<span class="pill">' + esc(c) + "</span>"; }).join("") +
        "</td><td class=\"num\">" + fmtUsd(r.tvl) + "</td><td class=\"num\">" + fmtChg(r.chg) + "</td><td class=\"num\"><b>" + fmtUsd(r.implied) + "</b></td></tr>";
    });
    return html + "</tbody></table>";
  }

  function detailHtml(r) {
    var rank = ROWS.indexOf(r) + 1;
    var steps = renderSteps(r);
    var html = '<div class="detail"><a class="back" href="#/board">&larr; Back to board</a><h2>' + esc(r.name) + '</h2>' +
      '<p class="meta">Rank #' + rank + " · " + esc(r.category || "Uncategorized") + " · records no token · listed " + esc(r.listed || "unknown") + "</p>" +
      '<div class="grid">' +
      '<div class="cell"><b>' + fmtUsd(r.implied) + '</b><span>Implied value</span></div>' +
      '<div class="cell"><b>' + fmtUsd(r.tvl) + '</b><span>TVL</span></div>' +
      '<div class="cell"><b>' + (r.chg === null ? "—" : (r.chg >= 0 ? "+" : "") + r.chg.toFixed(1) + "%") + '</b><span>7-day change</span></div>' +
      '<div class="cell"><b>' + ageDays(r) + ' days</b><span>Tracked, no token</span></div>' +
      '<div class="cell"><b>' + r.peer.toFixed(2) + 'x</b><span>Peer multiple</span></div>' +
      '<div class="cell"><b>' + r.growth.toFixed(2) + 'x</b><span>Growth factor</span></div>' +
      '<div class="cell"><b>' + r.age.toFixed(2) + 'x</b><span>Age factor</span></div>' +
      "</div>" +
      '<p class="formula">Implied value = TVL (' + fmtUsd(r.tvl) + ') × peer multiple (' + r.peer.toFixed(2) + 'x, median market-cap/TVL of live-token ' + esc(r.category || "uncategorized") + ' protocols) × growth (' + r.growth.toFixed(2) + 'x) × age (' + r.age.toFixed(2) + 'x) × chain diversity. This board\u2019s own claim, not a launch forecast.</p>' +
      "<h3>How to farm it</h3><ol class=\"steps\">" +
      steps.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") +
      "</ol></div>";
    return html;
  }

  function render() {
    var h = window.location.hash || "#/board";
    if (h.indexOf("#/protocol/") === 0) {
      var slug = decodeURIComponent(h.slice(11).split("?")[0]);
      var r = BY_SLUG[slug];
      view.innerHTML = r ? detailHtml(r) : '<div class="empty">Unknown protocol.</div>';
      return;
    }
    if (h.indexOf("#/filter") === 0) {
      var m = h.match(/category=([^&]*)/);
      if (m) { state.cat = decodeURIComponent(m[1]); var sel = document.getElementById("cat"); if (sel) sel.value = state.cat; }
    }
    view.innerHTML = boardHtml(filtered());
  }

  function init() {
    view = document.getElementById("view");
    document.getElementById("asof").textContent = D.as_of || "—";
    document.getElementById("count").textContent = String(ROWS.length);
    document.getElementById("topval").textContent = ROWS.length ? fmtUsd(ROWS[0].implied) : "—";
    var cats = [], chains = [];
    ROWS.forEach(function (r) {
      if (r.category && cats.indexOf(r.category) < 0) cats.push(r.category);
      (r.chains || []).forEach(function (c) { if (chains.indexOf(c) < 0) chains.push(c); });
    });
    cats.sort(); chains.sort();
    var catSel = document.getElementById("cat");
    cats.forEach(function (c) { var o = document.createElement("option"); o.value = c; o.textContent = c; catSel.appendChild(o); });
    var chainSel = document.getElementById("chain");
    chains.forEach(function (c) { var o = document.createElement("option"); o.value = c; o.textContent = c; chainSel.appendChild(o); });
    document.getElementById("q").addEventListener("input", function (e) { state.q = e.target.value; render(); });
    catSel.addEventListener("change", function (e) { state.cat = e.target.value; render(); });
    chainSel.addEventListener("change", function (e) { state.chain = e.target.value; render(); });
    document.getElementById("sort").addEventListener("change", function (e) { state.sort = e.target.value; render(); });
    window.addEventListener("hashchange", render);
    render();
  }
  if (typeof document !== "undefined" && document.addEventListener) {
    document.addEventListener("DOMContentLoaded", init);
  }
})();
