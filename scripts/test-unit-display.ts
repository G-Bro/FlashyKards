import {
  formatStatValue,
  getAbilityTagsFromDatasheet,
  formatUnitLabel,
  mergeUniqueStatBlocks,
  statBlocksForUnitIds,
} from '../src/roster/unitDisplay';
import type { StatBlock } from '../src/parsers/types';

const assert = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(msg);
};

assert(formatUnitLabel({ name: 'Intercessor Squad', modelCount: 5, points: 80, isWarlord: false }) === '5x Intercessor Squad (80)', 'model count prefix');
assert(
  getAbilityTagsFromDatasheet(['Infantry', 'Battleline', 'Deep Strike'], []).includes('Deep Strike'),
  'deep strike from keywords',
);
assert(
  getAbilityTagsFromDatasheet(['Infantry'], ['Scouts']).includes('Scouts'),
  'scouts from ability name',
);
assert(
  getAbilityTagsFromDatasheet(['Infiltrators'], []).includes('Infiltrators'),
  'infiltrators from keywords',
);

const blockA: StatBlock = { label: 'Guardian', stats: { M: '7"', T: '3', Sv: '4+', W: '1' } };
const blockB: StatBlock = { label: 'Platform', stats: { M: '7"', T: '3', Sv: '4+', W: '2' } };
const blockDuplicate: StatBlock = { label: 'Guardian duplicate', stats: { M: '7"', T: '3', Sv: '4+', W: '1' } };

assert(mergeUniqueStatBlocks([[blockA, blockB], [blockDuplicate]]).length === 2, 'dedupe stat blocks');
assert(
  statBlocksForUnitIds(['a', 'b'], { a: [blockA], b: [blockB] }).length === 2,
  'merge stat blocks across units',
);
assert(formatStatValue({}, 'T') === '—', 'missing stat placeholder');

console.log('All unit display tests passed.');
