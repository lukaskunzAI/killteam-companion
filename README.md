# Kill Team Companion

A clean, password-gated reader for the **Kill Team V3** core rules plus a
game-side tracker for Command Points, Turning Points, VP, objectives, and
operatives.

## Stack

- Vite + React 19 + Tailwind v4 + Framer Motion
- Static site, deploys to GitHub Pages
- Rules content is bundled as an AES-GCM encrypted blob; the password is
  required to decrypt it client-side

## Local development

```bash
# 1. drop the extracted rules JSON at ./rules-source.json (gitignored)
# 2. install + run
npm install
npm run dev
```

The default dev password is `killteam-2026`. Override it for production
deploys via the `KT_APP_PASSWORD` env var (or GitHub secret of the same
name on the deploy workflow).

## Build

```bash
npm run build       # encrypts rules-source.json + builds the site
npm run preview     # previews the production bundle
```

## Re-encrypting with a different password

```bash
KT_APP_PASSWORD="my-shared-pw" node scripts/encrypt-rules.mjs
```

## Updating the rules content

Re-run the extractor against a fresh Wahapedia HTML dump:

```bash
curl -sA "Mozilla/5.0" \
  https://wahapedia.ru/kill-team3/the-rules/core-rules/ \
  -o /tmp/kt_core.html
python3 scripts/extract-rules.py /tmp/kt_core.html ./rules-source.json
node scripts/encrypt-rules.mjs
```

Requires `beautifulsoup4` + `lxml`: `pip3 install --user beautifulsoup4 lxml`.

## Roadmap

- Team-specific rules and datacards (each team has its own page on Wahapedia)
- Action AP icons and quick-reference cards
- Tac Op / Crit Op selection per mission pack
- Soft import/export of game state (JSON)
