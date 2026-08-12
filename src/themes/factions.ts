export interface FactionTheme {
  id: string;
  primary: string;
  secondary: string;
  text: string;
  accent: string;
}

const theme = (
  id: string,
  primary: string,
  secondary: string,
  text = '#FFFFFF',
  accent?: string,
): FactionTheme => ({
  id,
  primary,
  secondary,
  text,
  accent: accent ?? primary,
});

export const FACTION_THEMES: Record<string, FactionTheme> = {
  'Imperium - Blood Angels': theme('blood-angels', '#8B0000', '#4A0000'),
  'Imperium - Ultramarines': theme('ultramarines', '#1E3A8A', '#0F172A'),
  'Imperium - Salamanders': theme('salamanders', '#2E7D32', '#1B5E20'),
  'Imperium - Dark Angels': theme('dark-angels', '#1B5E20', '#0D2818'),
  'Imperium - Imperial Fists': theme('imperial-fists', '#F9A825', '#E65100', '#1A1A1A'),
  'Imperium - White Scars': theme('white-scars', '#ECEFF1', '#CFD8DC', '#1A1A1A', '#1565C0'),
  'Imperium - Iron Hands': theme('iron-hands', '#37474F', '#263238'),
  'Imperium - Raven Guard': theme('raven-guard', '#212121', '#000000'),
  'Imperium - Space Wolves': theme('space-wolves', '#1565C0', '#0D47A1'),
  'Imperium - Black Templars': theme('black-templars', '#212121', '#000000', '#FFFFFF', '#B71C1C'),
  'Imperium - Space Marines': theme('space-marines', '#37474F', '#263238'),
  'Imperium - Grey Knights': theme('grey-knights', '#78909C', '#455A64'),
  'Imperium - Adepta Sororitas': theme('sororitas', '#AD1457', '#880E4F'),
  'Imperium - Adeptus Custodes': theme('custodes', '#FFD700', '#B8860B', '#1A1A1A'),
  'Imperium - Adeptus Mechanicus': theme('mechanicus', '#BF360C', '#8D2A0A'),
  'Imperium - Astra Militarum': theme('astra-militarum', '#33691E', '#1B5E20'),
  'Imperium - Imperial Knights': theme('imperial-knights', '#1565C0', '#0D47A1'),
  'Imperium - Deathwatch': theme('deathwatch', '#37474F', '#212121'),
  'Aeldari - Craftworlds': theme('aeldari', '#F0C830', '#C9960C', '#1A1A1A'),
  'Aeldari - Drukhari': theme('drukhari', '#4B0082', '#311B92'),
  'Chaos - Chaos Space Marines': theme('csm', '#4A148C', '#311B92'),
  'Chaos - Death Guard': theme('death-guard', '#558B2F', '#33691E'),
  'Chaos - Thousand Sons': theme('thousand-sons', '#00838F', '#006064'),
  'Chaos - World Eaters': theme('world-eaters', '#B71C1C', '#7F0000'),
  "Chaos - Emperor's Children": theme('emperors-children', '#7B1FA2', '#4A148C'),
  'Chaos - Chaos Daemons': theme('chaos-daemons', '#6A1B9A', '#4A148C'),
  'Chaos - Chaos Knights': theme('chaos-knights', '#37474F', '#212121', '#FFFFFF', '#B71C1C'),
  Necrons: theme('necrons', '#00695C', '#004D40'),
  Orks: theme('orks', '#2E7D32', '#1B5E20'),
  Tyranids: theme('tyranids', '#6A1B9A', '#4A148C'),
  "T'au Empire": theme('tau', '#F57F17', '#E65100', '#1A1A1A'),
  'Leagues of Votann': theme('votann', '#FF6F00', '#E65100', '#1A1A1A'),
  'Genestealer Cults': theme('gsc', '#6A1B9A', '#4A148C'),
};

const FACTION_KEYWORD_MAP: Record<string, string> = {
  'chaos - chaos knights': 'Chaos - Chaos Knights',
  'chaos - chaos space marines': 'Chaos - Chaos Space Marines',
  'chaos - death guard': 'Chaos - Death Guard',
  'chaos - thousand sons': 'Chaos - Thousand Sons',
  'chaos - world eaters': 'Chaos - World Eaters',
  "chaos - emperor's children": "Chaos - Emperor's Children",
  'chaos - chaos daemons': 'Chaos - Chaos Daemons',
  'imperium - adepta sororitas': 'Imperium - Adepta Sororitas',
  'imperium - adeptus custodes': 'Imperium - Adeptus Custodes',
  'imperium - adeptus mechanicus': 'Imperium - Adeptus Mechanicus',
  'imperium - astra militarum': 'Imperium - Astra Militarum',
  'imperium - space marines': 'Imperium - Space Marines',
  'imperium - blood angels': 'Imperium - Blood Angels',
  'imperium - ultramarines': 'Imperium - Ultramarines',
  'imperium - salamanders': 'Imperium - Salamanders',
  'imperium - dark angels': 'Imperium - Dark Angels',
  'imperium - grey knights': 'Imperium - Grey Knights',
  'imperium - imperial knights': 'Imperium - Imperial Knights',
  'aeldari - craftworlds': 'Aeldari - Craftworlds',
  'aeldari - drukhari': 'Aeldari - Drukhari',
  necrons: 'Necrons',
  orks: 'Orks',
  tyranids: 'Tyranids',
  "t'au empire": "T'au Empire",
  'leagues of votann': 'Leagues of Votann',
  'genestealer cults': 'Genestealer Cults',
};

const FALLBACK_THEME = theme('fallback', '#37474F', '#263238');

export function getFactionTheme(catalogueName: string, factionKeyword?: string): FactionTheme {
  if (FACTION_THEMES[catalogueName]) {
    return FACTION_THEMES[catalogueName];
  }

  const normalizedCatalogue = catalogueName.toLowerCase();
  for (const [key, themeId] of Object.entries(FACTION_THEMES)) {
    if (normalizedCatalogue.includes(key.toLowerCase())) {
      return themeId;
    }
  }

  if (factionKeyword) {
    const mapped = FACTION_KEYWORD_MAP[factionKeyword.toLowerCase().trim()];
    if (mapped && FACTION_THEMES[mapped]) {
      return FACTION_THEMES[mapped];
    }
  }

  return FALLBACK_THEME;
}
