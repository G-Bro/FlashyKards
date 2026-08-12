import { parseGwText } from '../src/parsers/gw-text';
import { resolveArmy } from '../src/bsdata/resolveArmy';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import manifest from '../public/catalogue-manifest.json';

const assert = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(msg);
};

const fixture = readFileSync(join(import.meta.dirname, 'fixtures', 'aeldari-legacy.txt'), 'utf8');
const { roster } = parseGwText(fixture);

assert(roster.catalogueName === 'Aeldari - Craftworlds', `catalogue: ${roster.catalogueName}`);
assert(roster.units.length === 7, `units: ${roster.units.length}`);
assert(roster.units.some((u) => u.name === 'The Yncarne' && u.isWarlord), 'Yncarne warlord');
assert(
  roster.units.find((u) => u.name === 'Corsair Voidreavers')?.modelCount === 10,
  'voidreavers count',
);

const resolution = await resolveArmy({ roster, enhancements: [] }, manifest);
assert(resolution.catalogues[0].filename === 'Aeldari - Craftworlds.json', 'loads craftworlds');
const yncarne = resolution.resolvedUnits.find((u) => u.rosterUnit.name === 'The Yncarne')!;
assert(yncarne.matchStatus === 'matched', `Yncarne match: ${yncarne.matchStatus}`);

console.log('All Aeldari legacy tests passed.');
