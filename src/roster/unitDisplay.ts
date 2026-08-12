import type { RosterUnit, StatBlock, UnitStats } from '../parsers/types';

export const PREVIEW_ABILITY_TAGS = [
  { match: 'deep strike', label: 'Deep Strike' },
  { match: 'scouts', label: 'Scouts' },
  { match: 'infiltrators', label: 'Infiltrators' },
] as const;

export function formatUnitLabel(unit: Pick<RosterUnit, 'name' | 'modelCount' | 'points' | 'isWarlord'>): string {
  const count = unit.modelCount > 1 ? `${unit.modelCount}x ` : '';
  const warlord = unit.isWarlord ? ' ★' : '';
  return `${count}${unit.name} (${unit.points})${warlord}`;
}

export function getPreviewAbilityTags(sources: string[]): string[] {
  const haystack = sources.join(' ').toLowerCase();
  return PREVIEW_ABILITY_TAGS.filter(({ match }) => haystack.includes(match)).map(({ label }) => label);
}

export function getAbilityTagsFromDatasheet(keywords: string[], abilityNames: string[]): string[] {
  return getPreviewAbilityTags([...keywords, ...abilityNames]);
}

const CORE_STAT_COLUMNS = [
  { key: 'M', label: 'M' },
  { key: 'T', label: 'T' },
  { key: 'Sv', label: 'Sv' },
  { key: 'W', label: 'W' },
  { key: 'LD', label: 'LD' },
  { key: 'OC', label: 'OC' },
  { key: 'InvSv', label: 'Inv' },
] as const satisfies ReadonlyArray<{ key: keyof UnitStats; label: string }>;

export const STAT_TABLE_COLUMNS = CORE_STAT_COLUMNS;

function statsKey(stats: UnitStats): string {
  return CORE_STAT_COLUMNS.map(({ key }) => stats[key] ?? '').join('|');
}

export function mergeUniqueStatBlocks(blockLists: StatBlock[][]): StatBlock[] {
  const seen = new Set<string>();
  const merged: StatBlock[] = [];

  for (const blocks of blockLists) {
    for (const block of blocks) {
      const key = statsKey(block.stats);
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(block);
    }
  }

  return merged;
}

export function statBlocksForUnitIds(
  unitIds: string[],
  unitStatBlocks: Record<string, StatBlock[]>,
): StatBlock[] {
  return mergeUniqueStatBlocks(unitIds.map((id) => unitStatBlocks[id] ?? []));
}

export function formatStatValue(stats: UnitStats, key: keyof UnitStats): string {
  return stats[key]?.trim() || '—';
}
