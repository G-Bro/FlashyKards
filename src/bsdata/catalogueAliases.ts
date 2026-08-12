export function normalizeFactionKey(name: string): string {
  return name
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** GW app faction keywords that differ from BSData catalogue filenames. */
export const FACTION_CATALOGUE_ALIASES: Record<string, string> = {
  'xenos aeldari': 'Aeldari - Craftworlds',
  aeldari: 'Aeldari - Craftworlds',
  craftworlds: 'Aeldari - Craftworlds',
  drukhari: 'Aeldari - Drukhari',
  'xenos necrons': 'Necrons',
  necrons: 'Necrons',
  'xenos orks': 'Orks',
  orks: 'Orks',
  'xenos tyranids': 'Tyranids',
  tyranids: 'Tyranids',
  'xenos t au empire': "T'au Empire",
  "t'au empire": "T'au Empire",
  'xenos leagues of votann': 'Leagues of Votann',
  'leagues of votann': 'Leagues of Votann',
  'xenos genestealer cults': 'Genestealer Cults',
  'genestealer cults': 'Genestealer Cults',
  'imperium adeptus astartes': 'Imperium - Space Marines',
  'imperium space marines': 'Imperium - Space Marines',
  'space marines': 'Imperium - Space Marines',
  'chaos heretic astartes': 'Chaos - Chaos Space Marines',
  'chaos space marines': 'Chaos - Chaos Space Marines',
};

export function resolveCatalogueAlias(faction: string): string | undefined {
  return FACTION_CATALOGUE_ALIASES[normalizeFactionKey(faction)];
}
