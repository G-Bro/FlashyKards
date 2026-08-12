export interface UnitAttachment {
  role: 'leader' | 'bodyguard' | 'support';
  groupId: string;
  partnerName?: string;
}

export interface RosterUnit {
  id: string;
  name: string;
  points: number;
  modelCount: number;
  isWarlord: boolean;
  enhancement?: string;
  wargear: string[];
  categories: string[];
  role?: string;
  attachment?: UnitAttachment;
}

export interface Roster {
  name: string;
  faction: string;
  subfaction?: string;
  catalogueName: string;
  detachment: string;
  points: number;
  forceDisposition?: string;
  units: RosterUnit[];
}

export interface WeaponProfile {
  name: string;
  range?: string;
  attacks?: string;
  skill?: string;
  strength?: string;
  ap?: string;
  damage?: string;
  keywords?: string[];
}

export interface UnitStats {
  M?: string;
  T?: string;
  Sv?: string;
  W?: string;
  LD?: string;
  OC?: string;
  InvSv?: string;
}

export interface StatBlock {
  label: string;
  stats: UnitStats;
}

export interface Datasheet {
  id: string;
  name: string;
  points: number;
  stats: UnitStats;
  statBlocks: StatBlock[];
  keywords: string[];
  abilities: Array<{ name: string; description: string }>;
  rangedWeapons: WeaponProfile[];
  meleeWeapons: WeaponProfile[];
}

export interface ResolvedUnit {
  rosterUnit: RosterUnit;
  datasheet: Datasheet | null;
  matchStatus: 'matched' | 'unmatched' | 'manual';
  manualEntryId?: string;
}

export interface DetachmentInfo {
  name: string;
  description: string;
}

export interface EnhancementInfo {
  name: string;
  description: string;
  detachment?: string;
  points: number;
}

export interface ParsedArmy {
  roster: Roster;
  detachment?: DetachmentInfo;
  enhancements: EnhancementInfo[];
}
