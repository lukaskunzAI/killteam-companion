// Combine the core-rules JSON with all team JSONs into a single corpus the
// app loads at runtime. Run this after each extractor invocation.
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const CORE = join(ROOT, "rules-source.json");
const TEAMS_DIR = join(ROOT, "teams-source");
const OUT = join(ROOT, "corpus-source.json");

if (!existsSync(CORE)) {
  console.error(`Missing ${CORE}.`);
  process.exit(1);
}

const coreRules = JSON.parse(readFileSync(CORE, "utf8"));

const teams = [];
if (existsSync(TEAMS_DIR)) {
  for (const f of readdirSync(TEAMS_DIR).sort()) {
    if (!f.endsWith(".json")) continue;
    const data = JSON.parse(readFileSync(join(TEAMS_DIR, f), "utf8"));
    teams.push(data);
  }
}

const corpus = {
  version: 1,
  generatedAt: new Date().toISOString(),
  coreRules,
  teams,
};

writeFileSync(OUT, JSON.stringify(corpus));
console.log(
  `[build-corpus] wrote ${OUT} (${coreRules.length} core sections, ${teams.length} team(s))`,
);
