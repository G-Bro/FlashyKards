import { fetchCatalogueChain } from '../src/bsdata/loader';
import { matchUnitName, normalizeUnitName } from '../src/bsdata/resolver';
import { resolveArmy } from '../src/bsdata/resolveArmy';
import { parseGwText } from '../src/parsers/gw-text';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import manifest from '../public/catalogue-manifest.json';

const assert = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(msg);
};

const catalogues = await fetchCatalogueChain('Imperium - Salamanders');

assert(normalizeUnitName("Vulkan He\u2019stan") === 'vulkan hestan', 'curly apostrophe normalizes');
assert(normalizeUnitName("Vulkan He'stan") === 'vulkan hestan', 'straight apostrophe normalizes');

for (const name of ["Vulkan He'stan", "Vulkan He\u2019stan", 'Vulkan Hestan']) {
  const match = matchUnitName(name, catalogues);
  assert(match.entry?.name === "Vulkan He'stan", `${JSON.stringify(name)} should match Vulkan`);
  assert(
    match.confidence === 'exact' || match.confidence === 'normalized',
    `${JSON.stringify(name)} should be exact/normalized, got ${match.confidence}`,
  );
  assert((match.entry?.profiles?.length ?? 0) > 0, `${JSON.stringify(name)} should resolve full entry`);
}

const combinedHeader = `A1: Heroes Edition (2000 points)

Space Marines — Salamanders
Forgefather's Seekers and Librarius Conclave (3 Detachment Points)
Strike Force (2000 points)

CHARACTERS
Vulkan He\u2019stan (85 points)`;

const combined = parseGwText(combinedHeader);
assert(combined.roster.catalogueName === 'Imperium - Salamanders', 'combined chapter line resolves catalogue');

const fixture = readFileSync(join(import.meta.dirname, 'fixtures', 'gw-salamanders-v2.txt'), 'utf8');
const army = parseGwText(fixture.replace("Vulkan He'stan", 'Vulkan He\u2019stan'));
const resolution = await resolveArmy(army, manifest);
const vulkan = resolution.resolvedUnits.find((u) => u.rosterUnit.name.includes('Vulkan'))!;
assert(vulkan.matchStatus === 'matched', `fixture Vulkan should be matched, got ${vulkan.matchStatus}`);
assert(!!vulkan.datasheet?.stats.T, 'Vulkan should have datasheet stats');

const aeldari = await fetchCatalogueChain('Aeldari - Craftworlds');
const yncarne = matchUnitName('The Yncarne', aeldari);
assert(yncarne.entry != null, 'Yncarne should match');
const { extractDatasheet } = await import('../src/bsdata/extractor');
const yncarneSheet = extractDatasheet(yncarne.entry!, aeldari);
assert(yncarneSheet.statBlocks[0]?.stats.InvSv === '4+', 'Yncarne should have 4+ invuln');

console.log('All unit match tests passed.');
