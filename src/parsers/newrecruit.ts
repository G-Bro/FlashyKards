import type { ParsedArmy, Roster, RosterUnit } from './types';

let unitCounter = 0;

function nextUnitId(): string {
  unitCounter += 1;
  return `unit-${unitCounter}`;
}

function getPts(costs: Array<{ name: string; value: number }> | undefined): number {
  return costs?.find((c) => c.name === 'pts')?.value ?? 0;
}

function isNewRecruitExport(data: unknown): data is Record<string, unknown> {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  if (typeof obj.generatedBy === 'string' && obj.generatedBy.includes('newrecruit')) return true;
  const roster = obj.roster as Record<string, unknown> | undefined;
  return roster?.xmlns === 'http://www.battlescribe.net/schema/rosterSchema';
}

interface NRSelection {
  name: string;
  type?: string;
  number?: number;
  group?: string;
  costs?: Array<{ name: string; value: number }>;
  categories?: Array<{ name: string }>;
  selections?: NRSelection[];
}

function flattenSelections(
  selections: NRSelection[],
  role: string | undefined,
  units: RosterUnit[],
  detachmentRef: { value: string },
  attachmentGroups: Map<string, { leaders: string[]; bodyguards: string[] }>,
): void {
  for (const sel of selections) {
    if (sel.name === 'Detachment' && sel.selections?.[0]) {
      detachmentRef.value = sel.selections[0].name;
      continue;
    }

    if (sel.group?.startsWith('Enhancements')) {
      continue;
    }

    const type = sel.type ?? '';
    if (type === 'unit' || type === 'model') {
      const id = nextUnitId();
      const categories = sel.categories?.map((c) => c.name) ?? [];
      const wargear: string[] = [];
      let enhancement: string | undefined;
      let isWarlord = categories.some((c) => c.toLowerCase() === 'warlord');

      for (const child of sel.selections ?? []) {
        if (child.group?.startsWith('Enhancements')) {
          enhancement = child.name;
        } else if (child.type === 'upgrade') {
          wargear.push(child.name);
        } else if (child.categories?.some((c) => c.name.toLowerCase() === 'warlord')) {
          isWarlord = true;
        }
      }

      const unit: RosterUnit = {
        id,
        name: sel.name,
        points: getPts(sel.costs),
        modelCount: sel.number ?? 1,
        isWarlord,
        enhancement,
        wargear,
        categories,
        role,
      };

      if (sel.group?.toLowerCase().includes('attached')) {
        const groupId = sel.group;
        const group = attachmentGroups.get(groupId) ?? { leaders: [], bodyguards: [] };
        const isLeader = categories.some(
          (c) => c.toLowerCase().includes('character') || role?.toLowerCase().includes('character'),
        );
        if (isLeader) {
          group.leaders.push(id);
          unit.attachment = { role: 'leader', groupId };
        } else {
          group.bodyguards.push(id);
          unit.attachment = { role: 'bodyguard', groupId };
        }
        attachmentGroups.set(groupId, group);
      }

      units.push(unit);
      continue;
    }

    if (sel.selections?.length) {
      flattenSelections(sel.selections, sel.name, units, detachmentRef, attachmentGroups);
    }
  }
}

export function parseNewRecruitJson(raw: unknown): ParsedArmy {
  if (!isNewRecruitExport(raw)) {
    throw new Error('Not a recognised NewRecruit / BattleScribe JSON export.');
  }

  unitCounter = 0;
  const data = raw as {
    name?: string;
    roster?: {
      costs?: Array<{ name: string; value: number }>;
      forces?: Array<{
        name?: string;
        catalogueName?: string;
        selections?: NRSelection[];
      }>;
    };
  };

  const force = data.roster?.forces?.[0];
  if (!force) throw new Error('No force found in roster.');

  const units: RosterUnit[] = [];
  const detachmentRef = { value: '' };
  const attachmentGroups = new Map<string, { leaders: string[]; bodyguards: string[] }>();

  flattenSelections(force.selections ?? [], undefined, units, detachmentRef, attachmentGroups);

  const factionCategory = units
    .flatMap((u) => u.categories)
    .find((c) => c.startsWith('Faction:'));

  const roster: Roster = {
    name: data.name ?? 'Imported Army',
    faction: factionCategory?.replace('Faction:', '').trim() ?? force.name ?? 'Unknown',
    catalogueName: force.catalogueName ?? force.name ?? 'Unknown',
    detachment: detachmentRef.value,
    points: getPts(data.roster?.costs) || units.reduce((sum, u) => sum + u.points, 0),
    units,
  };

  return { roster, enhancements: [] };
}
