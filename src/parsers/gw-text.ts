import type { ParsedArmy, Roster, RosterUnit, UnitAttachment } from './types';
import { matchForceDisposition } from '../themes/dispositions';
import { resolveCatalogueAlias } from '../bsdata/catalogueAliases';

let unitCounter = 0;

function nextUnitId(): string {
  unitCounter += 1;
  return `unit-${unitCounter}`;
}

const FACTION_CATALOGUE_MAP: Record<string, string> = {
  necrons: 'Necrons',
  orks: 'Orks',
  tyranids: 'Tyranids',
  "t'au empire": "T'au Empire",
  'leagues of votann': 'Leagues of Votann',
  'genestealer cults': 'Genestealer Cults',
  'space marines': 'Imperium - Space Marines',
  'chaos space marines': 'Chaos - Chaos Space Marines',
  'chaos - chaos space marines': 'Chaos - Chaos Space Marines',
  'grey knights': 'Imperium - Grey Knights',
  'astra militarum': 'Imperium - Astra Militarum',
  'adepta sororitas': 'Imperium - Adepta Sororitas',
  'adeptus custodes': 'Imperium - Adeptus Custodes',
  'adeptus mechanicus': 'Imperium - Adeptus Mechanicus',
  'imperial knights': 'Imperium - Imperial Knights',
  'chaos knights': 'Chaos - Chaos Knights',
  'death guard': 'Chaos - Death Guard',
  'thousand sons': 'Chaos - Thousand Sons',
  'world eaters': 'Chaos - World Eaters',
  "emperor's children": "Chaos - Emperor's Children",
  'chaos daemons': 'Chaos - Chaos Daemons',
  craftworlds: 'Aeldari - Craftworlds',
  drukhari: 'Aeldari - Drukhari',
};

const CHAPTER_CATALOGUE_MAP: Record<string, string> = {
  salamanders: 'Imperium - Salamanders',
  ultramarines: 'Imperium - Ultramarines',
  'blood angels': 'Imperium - Blood Angels',
  'dark angels': 'Imperium - Dark Angels',
  'white scars': 'Imperium - White Scars',
  'imperial fists': 'Imperium - Imperial Fists',
  'iron hands': 'Imperium - Iron Hands',
  'raven guard': 'Imperium - Raven Guard',
  'space wolves': 'Imperium - Space Wolves',
  'black templars': 'Imperium - Black Templars',
  deathwatch: 'Imperium - Deathwatch',
};

const SECTION_HEADERS = new Set([
  'CHARACTERS',
  'BATTLELINE',
  'OTHER DATASHEETS',
  'DEDICATED TRANSPORT',
  'DEDICATED TRANSPORTS',
  'ALLIED UNITS',
  'FORTIFICATION',
  'ATTACHED UNITS',
]);

const BATTLE_SIZE_PATTERN = /^(Strike Force|Incursion|Onslaught|Combat Patrol)/i;
const DETACHMENT_POINTS_PATTERN = /\(\d+\s*Detachment\s*Points?\)/i;
const ATTACHED_UNIT_GROUP_PATTERN = /^Attached Unit (\d+)$/i;
const UNIT_POINTS_PATTERN = /^(.+?)\s*\((\d+)\s*(?:points|pts)\)\s*$/i;
const LEGACY_UNIT_LINE_PATTERN =
  /^(?:Char\d+:\s*)?(?:(\d+)x\s+)?(.+?)\s*\((\d+)\s*(?:points|pts)\)\s*(?::\s*(.+))?$/i;
const MODEL_COUNT_PATTERN = /^(\d+)x\s+(.+)$/i;

function parseUnitPointsLine(line: string): { name: string; points: number } | null {
  const match = line.match(UNIT_POINTS_PATTERN);
  if (!match) return null;
  return { name: match[1].trim(), points: parseInt(match[2], 10) };
}

function parseLegacyUnitLine(line: string): {
  name: string;
  points: number;
  modelCount: number;
  wargear?: string;
} | null {
  const match = line.match(LEGACY_UNIT_LINE_PATTERN);
  if (!match) return null;
  return {
    modelCount: match[1] ? parseInt(match[1], 10) : 1,
    name: match[2].trim(),
    points: parseInt(match[3], 10),
    wargear: match[4]?.trim(),
  };
}

function parseModelCount(name: string): { name: string; modelCount: number } {
  const match = name.match(MODEL_COUNT_PATTERN);
  if (match) {
    return { name: match[2].trim(), modelCount: parseInt(match[1], 10) };
  }
  return { name, modelCount: 1 };
}

function resolveCatalogueName(faction: string, subfaction?: string): string {
  if (subfaction) {
    const chapter = CHAPTER_CATALOGUE_MAP[subfaction.toLowerCase().trim()];
    if (chapter) return chapter;
  }

  const legacyKey = faction.toLowerCase().trim();
  const alias = resolveCatalogueAlias(faction);
  if (alias) return alias;
  if (FACTION_CATALOGUE_MAP[legacyKey]) return FACTION_CATALOGUE_MAP[legacyKey];

  if (subfaction) {
    const combined = `${faction} - ${subfaction}`;
    if (FACTION_CATALOGUE_MAP[combined.toLowerCase()]) {
      return FACTION_CATALOGUE_MAP[combined.toLowerCase()];
    }
    return combined;
  }

  return faction;
}

function isLegacyFormat(text: string): boolean {
  return text.includes('FACTION KEYWORD:') && text.includes('TOTAL ARMY POINTS:');
}

interface ParsedHeader {
  name: string;
  faction: string;
  subfaction?: string;
  catalogueName: string;
  detachment: string;
  points: number;
  forceDisposition?: string;
}

function parseModernHeader(preambleLines: string[]): ParsedHeader {
  let name = 'Imported Army';
  let points = 0;
  let faction = '';
  let subfaction = '';
  let detachment = '';
  let forceDisposition = '';

  for (let i = 0; i < preambleLines.length; i++) {
    const line = preambleLines[i].trim();
    if (!line) continue;

    if (i === 0) {
      const armyMatch = line.match(UNIT_POINTS_PATTERN);
      if (armyMatch) {
        name = armyMatch[1].trim();
        points = parseInt(armyMatch[2], 10);
      } else {
        name = line;
      }
      continue;
    }

    if (DETACHMENT_POINTS_PATTERN.test(line)) {
      detachment = line.replace(/\s*\(\d+\s*Detachment\s*Points?\)\s*/i, '').trim();
      continue;
    }

    const disposition = matchForceDisposition(line);
    if (disposition) {
      forceDisposition = disposition;
      continue;
    }

    if (BATTLE_SIZE_PATTERN.test(line)) {
      continue;
    }

    if (!faction) {
      const combinedChapter = line.match(/^Space Marines\s*[—–-]\s*(.+)$/i);
      if (combinedChapter) {
        faction = 'Space Marines';
        subfaction = combinedChapter[1].trim();
      } else {
        faction = line;
      }
      continue;
    }

    if (!subfaction && faction.toLowerCase() === 'space marines') {
      subfaction = line;
      continue;
    }
  }

  return {
    name,
    faction: subfaction ? `${faction} — ${subfaction}` : faction,
    subfaction: subfaction || undefined,
    catalogueName: resolveCatalogueName(faction, subfaction),
    detachment,
    points,
    forceDisposition: forceDisposition || undefined,
  };
}

function parseLegacyHeader(text: string): ParsedHeader {
  const factionMatch = text.match(/\+ FACTION KEYWORD:\s*(.+)/i);
  const detachmentMatch = text.match(/\+ DETACHMENT:\s*(.+)/i);
  const pointsMatch = text.match(/\+ TOTAL ARMY POINTS:\s*(\d+)/i);

  const factionRaw = factionMatch?.[1]?.trim() ?? 'Unknown';
  let detachment = detachmentMatch?.[1]?.trim() ?? '';
  const detachmentParts = detachment.match(/^(.+?)\s*\((.+)\)$/);
  if (detachmentParts) {
    detachment = detachmentParts[1].trim();
  }

  return {
    name: 'Imported Army',
    faction: factionRaw,
    catalogueName: resolveCatalogueName(factionRaw),
    detachment,
    points: pointsMatch ? parseInt(pointsMatch[1], 10) : 0,
  };
}

function parseAttachmentRole(text: string): UnitAttachment['role'] | null {
  const match = text.match(/Attached as:\s*(Leader|Bodyguard|Support)/i);
  if (!match) return null;
  const role = match[1].toLowerCase();
  if (role === 'leader') return 'leader';
  if (role === 'support') return 'support';
  return 'bodyguard';
}

function bulletIndent(rawLine: string): number {
  const match = rawLine.match(/^(\s*)[•\-]/);
  return match ? match[1].length : -1;
}

function handleUnitBullet(
  content: string,
  unit: RosterUnit,
  compositionUnits: Set<string>,
  indent: number,
  unitBulletIndents: Map<string, number>,
): void {
  const attachmentRole = parseAttachmentRole(content);
  if (attachmentRole && unit.attachment) {
    unit.attachment = { ...unit.attachment, role: attachmentRole };
    return;
  }

  if (/^warlord$/i.test(content)) {
    unit.isWarlord = true;
    return;
  }

  const enhancementMatch = content.match(/^Enhancement:\s*(.+)/i);
  if (enhancementMatch) {
    unit.enhancement = enhancementMatch[1].trim();
    return;
  }

  const modelMatch = content.match(/^(\d+)x\s/i);
  if (modelMatch) {
    const minIndent = unitBulletIndents.get(unit.id);
    if (minIndent === undefined) {
      unitBulletIndents.set(unit.id, indent);
    }
    if (indent !== unitBulletIndents.get(unit.id)) {
      return;
    }
    if (!compositionUnits.has(unit.id)) {
      unit.modelCount = 0;
      compositionUnits.add(unit.id);
    }
    unit.modelCount += parseInt(modelMatch[1], 10);
    return;
  }

  if (unitBulletIndents.get(unit.id) === undefined) {
    unitBulletIndents.set(unit.id, indent);
  }

  unit.wargear.push(content);
}

function finalizeModelCounts(units: RosterUnit[]): void {
  for (const unit of units) {
    if (unit.modelCount < 1) {
      unit.modelCount = 1;
    }
  }
}

function createUnit(
  rawName: string,
  points: number,
  role: string,
  groupId?: string,
): RosterUnit {
  const { name, modelCount } = parseModelCount(rawName);
  const unit: RosterUnit = {
    id: nextUnitId(),
    name,
    points,
    modelCount,
    isWarlord: false,
    wargear: [],
    categories: [],
    role,
  };

  if (groupId) {
    unit.attachment = { role: 'bodyguard', groupId };
  }

  return unit;
}

function parseModernBody(lines: string[]): RosterUnit[] {
  const units: RosterUnit[] = [];
  const compositionUnits = new Set<string>();
  const unitBulletIndents = new Map<string, number>();
  let currentRole = 'Other';
  let inAttachedSection = false;
  let currentAttachmentGroup = '';

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('Exported with')) continue;

    const attachedGroupMatch = line.match(ATTACHED_UNIT_GROUP_PATTERN);
    if (attachedGroupMatch) {
      inAttachedSection = true;
      currentAttachmentGroup = `attached-${attachedGroupMatch[1]}`;
      continue;
    }

    const upper = line.toUpperCase();
    if (upper === 'ATTACHED UNITS') {
      inAttachedSection = true;
      currentRole = 'Attached';
      continue;
    }

    if (SECTION_HEADERS.has(upper)) {
      inAttachedSection = upper === 'ATTACHED UNITS';
      if (!inAttachedSection) {
        currentAttachmentGroup = '';
      }
      currentRole = line;
      continue;
    }

    const parsed = parseUnitPointsLine(line);
    if (parsed && !BATTLE_SIZE_PATTERN.test(parsed.name)) {
      const unit = createUnit(
        parsed.name,
        parsed.points,
        currentRole,
        inAttachedSection && currentAttachmentGroup ? currentAttachmentGroup : undefined,
      );
      units.push(unit);
      continue;
    }

    if (line.startsWith('•') || line.startsWith('-')) {
      const content = line.replace(/^[•\-]\s*/, '').trim();
      const lastUnit = units[units.length - 1];
      if (lastUnit) {
        handleUnitBullet(content, lastUnit, compositionUnits, bulletIndent(rawLine), unitBulletIndents);
      }
    }
  }

  finalizeModelCounts(units);
  return units;
}

export function parseGwText(text: string): ParsedArmy {
  unitCounter = 0;
  const lines = text.split(/\r?\n/);

  if (isLegacyFormat(text)) {
    const header = parseLegacyHeader(text);
    const legacyWarlord = text.match(/\+ WARLORD:\s*(.+)/i)?.[1]?.trim();
    const legacyEnhancement = text.match(/\+ ENHANCEMENT:\s*(.+)/i)?.[1]?.trim();
    const units = parseLegacyBodyWithMeta(lines, header, legacyWarlord, legacyEnhancement);
    return buildParsedArmy(header, units);
  }

  const attachedIndex = lines.findIndex((l) => l.trim().toUpperCase() === 'ATTACHED UNITS');
  const firstSectionIndex = lines.findIndex((l) => SECTION_HEADERS.has(l.trim().toUpperCase()));
  const preambleEnd = attachedIndex >= 0 ? attachedIndex : firstSectionIndex >= 0 ? firstSectionIndex : lines.length;
  const preamble = lines.slice(0, preambleEnd);

  const header = parseModernHeader(preamble);
  const bodyStart = preambleEnd;
  const units = parseModernBody(lines.slice(bodyStart));

  return buildParsedArmy(header, units);
}

function parseLegacyBodyWithMeta(
  lines: string[],
  _header: ParsedHeader,
  warlord?: string,
  enhancementHeader?: string,
): RosterUnit[] {
  const units: RosterUnit[] = [];
  const compositionUnits = new Set<string>();
  const unitBulletIndents = new Map<string, number>();
  let currentRole = 'Other';
  let inAttachedSection = false;
  let attachmentGroupCounter = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('+++') || line.startsWith('Exported with')) continue;

    const upper = line.toUpperCase();
    if (SECTION_HEADERS.has(upper)) {
      currentRole = line;
      inAttachedSection = upper === 'ATTACHED UNITS';
      continue;
    }

    const legacyParsed = parseLegacyUnitLine(line);
    const parsed = legacyParsed ?? parseUnitPointsLine(line);
    if (parsed && !BATTLE_SIZE_PATTERN.test(parsed.name)) {
      const unit = createUnit(parsed.name, parsed.points, currentRole);
      if (legacyParsed) {
        unit.modelCount = legacyParsed.modelCount;
        if (legacyParsed.wargear) {
          unit.wargear.push(legacyParsed.wargear);
          if (/warlord/i.test(legacyParsed.wargear)) {
            unit.isWarlord = true;
          }
        }
      }
      if (inAttachedSection) {
        attachmentGroupCounter += 1;
        unit.attachment = {
          role: 'bodyguard',
          groupId: `attached-${attachmentGroupCounter}`,
        };
      }
      if (warlord?.toLowerCase().includes(unit.name.toLowerCase())) {
        unit.isWarlord = true;
      }
      if (enhancementHeader?.toLowerCase().includes(unit.name.toLowerCase())) {
        const enhMatch = enhancementHeader.match(/^(.+?)\s*\(/);
        unit.enhancement = enhMatch?.[1]?.trim() ?? enhancementHeader;
      }
      units.push(unit);
      continue;
    }

    if (line.startsWith('•') || line.startsWith('-')) {
      const content = line.replace(/^[•\-]\s*/, '').trim();
      const lastUnit = units[units.length - 1];
      if (lastUnit) {
        handleUnitBullet(content, lastUnit, compositionUnits, bulletIndent(rawLine), unitBulletIndents);
      }
    }
  }

  finalizeModelCounts(units);
  return units;
}

function buildParsedArmy(header: ParsedHeader, units: RosterUnit[]): ParsedArmy {
  const roster: Roster = {
    name: header.name,
    faction: header.faction,
    catalogueName: header.catalogueName,
    detachment: header.detachment,
    points: header.points || units.reduce((sum, u) => sum + u.points, 0),
    subfaction: header.subfaction,
    forceDisposition: header.forceDisposition,
    units,
  };

  return { roster, enhancements: [] };
}

export function isGwTextExport(text: string): boolean {
  if (isLegacyFormat(text)) return true;
  if (/Exported with App Version:/i.test(text)) return true;
  if (/Attached Units/i.test(text) && /\(\d+\s*points?\)/i.test(text)) return true;
  return false;
}

export function isNewRecruitJson(text: string): boolean {
  try {
    const data = JSON.parse(text);
    return (
      (typeof data.generatedBy === 'string' && data.generatedBy.includes('newrecruit')) ||
      data.roster?.xmlns === 'http://www.battlescribe.net/schema/rosterSchema'
    );
  } catch {
    return false;
  }
}
