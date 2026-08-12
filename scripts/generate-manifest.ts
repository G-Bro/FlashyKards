/**
 * Regenerates public/catalogue-manifest.json from BSData/wh40k-11e.
 * Run: npm run build:manifest
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { CatalogueManifest } from '../src/bsdata/types';

const BSDATA_API =
  'https://api.github.com/repos/BSData/wh40k-11e/contents/';

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
}

async function main(): Promise<void> {
  const response = await fetch(BSDATA_API);
  if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);
  const files = (await response.json()) as Array<{ name: string; download_url: string }>;
  const jsonFiles = files.filter((f) => f.name.endsWith('.json') && f.name !== 'Warhammer 40,000.json');

  const catalogues = jsonFiles.map((f) => ({
    filename: f.name,
    displayName: f.name.replace('.json', ''),
    factionKeywords: [f.name.replace('.json', '')],
  }));

  const factionKeywordMap: Record<string, string> = {};
  for (const cat of catalogues) {
    factionKeywordMap[normalizeName(cat.displayName)] = cat.filename;
    factionKeywordMap[normalizeName(cat.displayName.replace(/^Imperium - |^Chaos - |^Aeldari - /, ''))] =
      cat.filename;
  }

  const manifest: CatalogueManifest = {
    catalogues,
    factionKeywordMap,
    unitIndex: {},
  };

  const outPath = join(process.cwd(), 'public', 'catalogue-manifest.json');
  writeFileSync(outPath, JSON.stringify(manifest, null, 2));
  console.log(`Wrote ${catalogues.length} catalogues to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
