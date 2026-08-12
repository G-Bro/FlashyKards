import type {
  BSProfile,
  BSSelectionEntry,
  BSSharedRule,
  LoadedCatalogue,
} from './types';
import type {
  Datasheet,
  DetachmentInfo,
  EnhancementInfo,
  StatBlock,
  UnitStats,
  WeaponProfile,
} from '../parsers/types';

function getCharacteristic(profile: BSProfile, name: string): string | undefined {
  return profile.characteristics?.find((c) => c.name === name)?.$text?.trim();
}

function getInvulnerableSave(profile: BSProfile): string | undefined {
  for (const name of ['Inv Sv', 'InvSv', 'InSv', 'Inv']) {
    const value = getCharacteristic(profile, name);
    if (value) return value;
  }
  return undefined;
}

function extractStats(profile: BSProfile): UnitStats {
  return {
    M: getCharacteristic(profile, 'M'),
    T: getCharacteristic(profile, 'T'),
    Sv: getCharacteristic(profile, 'Sv'),
    W: getCharacteristic(profile, 'W'),
    LD: getCharacteristic(profile, 'LD'),
    OC: getCharacteristic(profile, 'OC'),
    InvSv: getInvulnerableSave(profile),
  };
}

function extractWeaponProfile(profile: BSProfile): WeaponProfile {
  const keywords = getCharacteristic(profile, 'Keywords');
  return {
    name: profile.name,
    range: getCharacteristic(profile, 'Range'),
    attacks: getCharacteristic(profile, 'A'),
    skill: getCharacteristic(profile, 'BS') ?? getCharacteristic(profile, 'WS'),
    strength: getCharacteristic(profile, 'S'),
    ap: getCharacteristic(profile, 'AP'),
    damage: getCharacteristic(profile, 'D'),
    keywords: keywords ? keywords.split(',').map((k) => k.trim()).filter(Boolean) : [],
  };
}

function collectProfiles(entry: BSSelectionEntry): BSProfile[] {
  const profiles: BSProfile[] = [...(entry.profiles ?? [])];
  for (const child of entry.selectionEntries ?? []) {
    profiles.push(...collectProfiles(child));
  }
  for (const group of entry.selectionEntryGroups ?? []) {
    for (const child of group.selectionEntries ?? []) {
      profiles.push(...collectProfiles(child));
    }
  }
  return profiles;
}

function getPoints(entry: BSSelectionEntry): number {
  return entry.costs?.find((c) => c.name === 'pts')?.value ?? 0;
}

function getAllSharedRules(catalogues: LoadedCatalogue[]): BSSharedRule[] {
  return catalogues.flatMap((c) => c.catalogue.sharedRules ?? []);
}

function resolveRuleDescription(
  ruleName: string,
  targetId: string | undefined,
  catalogues: LoadedCatalogue[],
): string {
  const rules = getAllSharedRules(catalogues);
  const rule = rules.find((r) => r.id === targetId || r.name === ruleName);
  return rule?.description ?? '';
}

function statsKey(stats: UnitStats): string {
  return [stats.M, stats.T, stats.Sv, stats.W, stats.LD, stats.OC, stats.InvSv]
    .map((value) => value ?? '')
    .join('|');
}

export function extractStatBlocks(entry: BSSelectionEntry): StatBlock[] {
  const profiles = collectProfiles(entry).filter((profile) => profile.typeName === 'Unit');
  const seen = new Set<string>();
  const blocks: StatBlock[] = [];

  for (const profile of profiles) {
    const stats = extractStats(profile);
    if (!Object.values(stats).some(Boolean)) continue;

    const key = statsKey(stats);
    if (seen.has(key)) continue;
    seen.add(key);

    blocks.push({
      label: profile.name,
      stats,
    });
  }

  return blocks;
}

export function extractDatasheet(
  entry: BSSelectionEntry,
  catalogues: LoadedCatalogue[],
): Datasheet {
  const profiles = collectProfiles(entry);
  const unitProfile = profiles.find((p) => p.typeName === 'Unit');
  const statBlocks = extractStatBlocks(entry);
  const abilityProfiles = profiles.filter((p) => p.typeName === 'Abilities');
  const rangedWeapons = profiles
    .filter((p) => p.typeName === 'Ranged Weapons')
    .map(extractWeaponProfile);
  const meleeWeapons = profiles
    .filter((p) => p.typeName === 'Melee Weapons')
    .map(extractWeaponProfile);

  const keywords =
    entry.categoryLinks?.map((c) => c.name).filter((n) => !n.startsWith('Hidden')) ?? [];

  const infoAbilities =
    entry.infoLinks?.map((link) => ({
      name: link.name,
      description: resolveRuleDescription(link.name, link.targetId, catalogues),
    })) ?? [];

  const profileAbilities = abilityProfiles.map((p) => ({
    name: p.name,
    description: getCharacteristic(p, 'Description') ?? '',
  }));

  return {
    id: entry.id,
    name: entry.name,
    points: getPoints(entry),
    stats: unitProfile ? extractStats(unitProfile) : statBlocks[0]?.stats ?? {},
    statBlocks,
    keywords,
    abilities: [...profileAbilities, ...infoAbilities].filter((a) => a.description || a.name),
    rangedWeapons,
    meleeWeapons,
  };
}

export function extractDetachment(
  detachmentName: string,
  catalogues: LoadedCatalogue[],
): DetachmentInfo | undefined {
  for (const { catalogue } of catalogues) {
    const detachmentEntry = catalogue.sharedSelectionEntries?.find((e) => e.name === 'Detachment');
    const groups = [
      ...(detachmentEntry?.selectionEntryGroups ?? []),
      ...(catalogue.sharedSelectionEntryGroups ?? []),
    ];

    for (const group of groups) {
      if (!group.name.toLowerCase().includes('detachment')) continue;
      for (const option of group.selectionEntries ?? []) {
        if (option.name === detachmentName || normalizeName(option.name) === normalizeName(detachmentName)) {
          const ruleLink = option.infoLinks?.[0];
          const description = ruleLink
            ? resolveRuleDescription(ruleLink.name, ruleLink.targetId, catalogues)
            : '';
          return { name: option.name, description };
        }
      }
    }
  }
  return undefined;
}

export function extractEnhancement(
  enhancementName: string,
  catalogues: LoadedCatalogue[],
): EnhancementInfo | undefined {
  for (const { catalogue } of catalogues) {
    for (const group of catalogue.sharedSelectionEntryGroups ?? []) {
      if (group.name !== 'Enhancements') continue;
      for (const entry of group.selectionEntries ?? []) {
        if (
          entry.name === enhancementName ||
          normalizeName(entry.name) === normalizeName(enhancementName)
        ) {
          const ability = entry.profiles?.find((p) => p.typeName === 'Abilities');
          return {
            name: entry.name,
            description: ability ? (getCharacteristic(ability, 'Description') ?? '') : '',
            detachment: entry.comment,
            points: getPoints(entry),
          };
        }
      }
    }
  }
  return undefined;
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
}
