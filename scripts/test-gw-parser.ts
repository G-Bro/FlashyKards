import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseGwText } from '../src/parsers/gw-text';
import { buildListSummary } from '../src/roster/groupAttachments';

const fixture = readFileSync(join(import.meta.dirname, 'fixtures', 'gw-salamanders-v2.txt'), 'utf8');
const { roster } = parseGwText(fixture);
const summary = buildListSummary(roster);

const assert = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(msg);
};

assert(roster.name === 'A1: Heroes Edition', `name: ${roster.name}`);
assert(roster.points === 2000, `points: ${roster.points}`);
assert(roster.catalogueName === 'Imperium - Salamanders', `catalogue: ${roster.catalogueName}`);
assert(
  roster.detachment === "Forgefather's Seekers and Librarius Conclave",
  `detachment: ${roster.detachment}`,
);
assert(roster.forceDisposition === 'Priority Assets', `disposition: ${roster.forceDisposition}`);
assert(roster.units.length === 18, `unit count: ${roster.units.length}`);

const vulkan = roster.units.find((u) => u.name.includes('Vulkan'));
assert(!!vulkan?.isWarlord, 'Vulkan should be warlord');
assert(vulkan?.attachment?.role === 'leader', 'Vulkan should be leader');

const captain = roster.units.find((u) => u.name.includes('Captain in Gravis'));
assert(captain?.enhancement === 'Immolator', `captain enhancement: ${captain?.enhancement}`);

const lieutenant = roster.units.find((u) => u.name === 'Lieutenant');
assert(lieutenant?.attachment?.role === 'support', 'Lieutenant should be support');
assert(lieutenant?.enhancement === 'Forged in Battle', 'Lieutenant enhancement');

assert(summary.attachedGroups.length === 4, `attached groups: ${summary.attachedGroups.length}`);

const intercessors = roster.units.find((u) => u.name === 'Intercessor Squad');
assert(intercessors?.modelCount === 5, `intercessors model count: ${intercessors?.modelCount}`);

const aggressors = roster.units.find((u) => u.name === 'Aggressor Squad');
assert(aggressors?.modelCount === 6, `aggressor model count: ${aggressors?.modelCount}`);

console.log('All GW v2 parser tests passed.');
console.log(`  ${roster.units.length} units, ${summary.attachedGroups.length} attached groups`);
console.log(`  catalogue: ${roster.catalogueName}`);
