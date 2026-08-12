import type { Roster, RosterUnit } from '../parsers/types';
import type { FactionTheme } from '../themes/factions';
import { getFactionTheme } from '../themes/factions';

export interface AttachedGroup {
  id: string;
  leaders: RosterUnit[];
  supports: RosterUnit[];
  bodyguards: RosterUnit[];
}

/** @deprecated use attachedGroups */
export interface AttachedPair {
  leader: RosterUnit;
  bodyguard: RosterUnit;
}

export interface EnhancementEntry {
  name: string;
  onUnit: string;
  points?: number;
}

export interface ListSummary {
  roster: Roster;
  theme: FactionTheme;
  attachedGroups: AttachedGroup[];
  attachedPairs: AttachedPair[];
  standaloneCharacters: RosterUnit[];
  enhancements: EnhancementEntry[];
  otherUnits: RosterUnit[];
}

function isCharacter(unit: RosterUnit): boolean {
  const role = unit.role?.toLowerCase() ?? '';
  const categories = unit.categories.map((c) => c.toLowerCase());
  const attachmentRole = unit.attachment?.role;
  return (
    role.includes('character') ||
    attachmentRole === 'leader' ||
    attachmentRole === 'support' ||
    categories.some((c) => c.includes('character')) ||
    categories.some((c) => c.includes('epic hero'))
  );
}

export function buildListSummary(roster: Roster): ListSummary {
  const theme = getFactionTheme(roster.catalogueName, roster.faction);
  const attachedGroups: AttachedGroup[] = [];
  const attachedPairs: AttachedPair[] = [];
  const attachedIds = new Set<string>();
  const groupMap = new Map<string, AttachedGroup>();

  for (const unit of roster.units) {
    if (!unit.attachment) continue;
    const group =
      groupMap.get(unit.attachment.groupId) ??
      { id: unit.attachment.groupId, leaders: [], supports: [], bodyguards: [] };

    if (unit.attachment.role === 'leader') {
      group.leaders.push(unit);
    } else if (unit.attachment.role === 'support') {
      group.supports.push(unit);
    } else {
      group.bodyguards.push(unit);
    }
    groupMap.set(unit.attachment.groupId, group);
  }

  for (const group of groupMap.values()) {
    attachedGroups.push(group);
    for (const unit of [...group.leaders, ...group.supports, ...group.bodyguards]) {
      attachedIds.add(unit.id);
    }

    const primaryLeader = group.leaders[0] ?? group.supports[0];
    const bodyguard = group.bodyguards[0];
    if (primaryLeader && bodyguard) {
      attachedPairs.push({ leader: primaryLeader, bodyguard });
    }
  }

  attachedGroups.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

  const enhancements: EnhancementEntry[] = roster.units
    .filter((u) => u.enhancement)
    .map((u) => ({ name: u.enhancement!, onUnit: u.name }));

  const unattached = roster.units.filter((u) => !attachedIds.has(u.id));

  const standaloneCharacters = unattached.filter((u) => isCharacter(u));

  const otherUnits = unattached.filter((u) => !standaloneCharacters.includes(u));

  return {
    roster,
    theme,
    attachedGroups,
    attachedPairs,
    standaloneCharacters,
    enhancements,
    otherUnits,
  };
}

export function formatAttachedGroup(group: AttachedGroup): string {
  const leaders = group.leaders.map((u) => `${u.name}${u.isWarlord ? ' ★' : ''}`);
  const supports = group.supports.map((u) => u.name);
  const left = [...leaders, ...supports].join(' + ');
  const right = group.bodyguards.map((u) => u.name).join(', ');
  if (left && right) return `${left} → ${right}`;
  return left || right;
}
