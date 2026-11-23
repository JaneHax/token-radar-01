// Token Radar — entrypoint (Node 22, standard library only).
// Reads the sealed snapshot, ranks the pre-token protocols by implied
// launch value, and writes the board, dashboard data, screenshots and
// dossier to the output directory. Deterministic: no clocks, no random
// numbers, so two runs write identical bytes.
import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync } from "node:fs";
import { join } from "node:path";
import { buildBoard } from "./lib/model.ts";
import { buildDossier } from "./vendor/makefun-board.ts";

function argValue(name: string, argv: string[]): string | null {
  const i = argv.indexOf(name);
  return i >= 0 && i + 1 < argv.length ? argv[i + 1] : null;
}

function main(): void {
  const argv = process.argv.slice(2);
  const inputDir = process.env.MAKEFUN_INPUT_DIR;
  const defaultInput = inputDir ? join(inputDir, "snapshot.json") : "/input/snapshot.json";
  const inputPath = argValue("--input", argv) ?? defaultInput;
  const outDir =
    argValue("--output", argv) ?? process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

  const snapshot = JSON.parse(readFileSync(inputPath, "utf8"));
  const rows = buildBoard(snapshot);

  mkdirSync(outDir, { recursive: true });
  mkdirSync(join(outDir, "dashboard"), { recursive: true });
  mkdirSync(join(outDir, "screenshots"), { recursive: true });

  writeFileSync(join(outDir, "board.json"), JSON.stringify({ rows }, null, 2) + "\n", "utf8");

  // Compact dashboard data: one array per row, chains trimmed to 3.
  const compact = rows.map((r) => [
    r.slug,
    r.name,
    r.category,
    r.chains.slice(0, 3),
    r.tvl_usd,
    r.change_7d,
    r.listed_at,
    r.implied_value_usd,
    r.peerMultiple,
    r.growthFactor,
    r.ageFactor,
  ]);
  const dataJs =
    "window.RADAR_DATA=" +
    JSON.stringify({ as_of: snapshot.as_of, floor_usd: snapshot.floor_usd, rows: compact }) +
    ";\n";
  writeFileSync(join(outDir, "dashboard", "data.js"), dataJs, "utf8");

  const here = new URL(".", import.meta.url).pathname;
  cpSync(join(here, "dashboard", "index.html"), join(outDir, "dashboard", "index.html"));
  cpSync(join(here, "dashboard", "app.css"), join(outDir, "dashboard", "app.css"));
  cpSync(join(here, "dashboard", "app.js"), join(outDir, "dashboard", "app.js"));
  if (existsSync(join(here, "screenshots"))) {
    cpSync(join(here, "screenshots"), join(outDir, "screenshots"), { recursive: true });
  }

  const result = buildDossier(outDir, { text_max_bytes: 65536 }) as unknown;
  // buildDossier returns the dossier bytes (a Uint8Array). Write them
  // as bytes, never as JSON: stringifying a byte array would explode it
  // into an object of numeric keys.
  if (result instanceof Uint8Array) {
    writeFileSync(join(outDir, "dossier.json"), result);
  } else if (typeof result === "string") {
    writeFileSync(join(outDir, "dossier.json"), result, "utf8");
  } else if (result !== undefined && result !== null && typeof result === "object") {
    writeFileSync(join(outDir, "dossier.json"), JSON.stringify(result), "utf8");
  }
}

main();
