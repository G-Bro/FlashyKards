# flashykards

Memorise Warhammer 40,000 11th Edition datasheets with flashcards generated from your army list.

Import a list from the **official GW app** (text export) or **NewRecruit** (JSON), review unit matching against [BSData/wh40k-11e](https://github.com/BSData/wh40k-11e), export a faction-themed list overview image for opponents, and quiz yourself on unit stats, weapons, abilities, detachments, and enhancements.

## Features

- **Army list import** — GW app text paste or NewRecruit JSON upload
- **BSData integration** — fetches faction catalogues from jsDelivr at runtime (no backend)
- **Flashcards** — unit stats, weapons, keywords, abilities, detachment rules, enhancements
- **List overview image** — minimalist PNG with faction colours, leader attachments, enhancements
- **Progress** — quiz state saved in localStorage
- **Static deploy** — runs on GitHub Pages with no login

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:5173/flashykards/

## Build & deploy

```bash
npm run build
```

Push to `main` to deploy via GitHub Actions to GitHub Pages. Enable Pages from **GitHub Actions** in repo settings.

Set repository name to `flashykards` or update `base` in [`vite.config.ts`](vite.config.ts).

## Import formats

### GW app (text)

Copy your army list from the Warhammer 40,000 app (v2.4+) and paste into the import box. The parser reads:

- Army name and total points from the first line
- Faction, chapter, detachment, and battle size from the header block
- **Attached Units** groups with Leader / Support / Bodyguard roles
- Inline **Enhancement:** and **Warlord** markers
- Section headers: `BATTLELINE`, `DEDICATED TRANSPORTS`, `OTHER DATASHEETS`

Legacy exports with the `++++` summary header are still supported.

### NewRecruit (JSON)

Export your list as JSON from [NewRecruit](https://www.newrecruit.eu) and upload the file.

## Regenerate catalogue manifest

```bash
npm run build:manifest
```

Fetches the file list from BSData/wh40k-11e and updates [`public/catalogue-manifest.json`](public/catalogue-manifest.json).

## Data attribution

Unit data is sourced from the community-maintained [BSData/wh40k-11e](https://github.com/BSData/wh40k-11e) repository. This project is not endorsed by Games Workshop.

## Project structure

```
src/
├── parsers/       # GW text & NewRecruit JSON parsers
├── bsdata/        # Catalogue loader, resolver, extractor
├── flashcards/    # Card generator & quiz logic
├── components/    # UI components
├── themes/        # Faction colour palettes
├── roster/        # List summary grouping
└── export/        # PNG export utilities
```

## License

MIT (application code). WH40K faction names and game data remain property of their respective owners.
