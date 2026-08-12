export const BSDATA_CDN_BASE =
  'https://cdn.jsdelivr.net/gh/BSData/wh40k-11e@main';

export interface CatalogueManifestEntry {
  filename: string;
  displayName: string;
  factionKeywords: string[];
}

export interface UnitIndexEntry {
  normalizedName: string;
  entryId: string;
  name: string;
}

export interface CatalogueManifest {
  catalogues: CatalogueManifestEntry[];
  factionKeywordMap: Record<string, string>;
  unitIndex: Record<string, UnitIndexEntry[]>;
}

export interface BSProfileCharacteristic {
  name: string;
  typeId?: string;
  $text?: string;
}

export interface BSProfile {
  id?: string;
  name: string;
  typeName?: string;
  typeId?: string;
  characteristics?: BSProfileCharacteristic[];
}

export interface BSCategoryLink {
  name: string;
  id?: string;
  targetId?: string;
}

export interface BSCost {
  name: string;
  typeId?: string;
  value: number;
}

export interface BSInfoLink {
  name: string;
  id?: string;
  targetId?: string;
  type?: string;
}

export interface BSSharedRule {
  id: string;
  name: string;
  description?: string;
  hidden?: boolean;
}

export interface BSSelectionEntry {
  id: string;
  name: string;
  type?: string;
  hidden?: boolean;
  import?: boolean;
  number?: number;
  comment?: string;
  costs?: BSCost[];
  profiles?: BSProfile[];
  categoryLinks?: BSCategoryLink[];
  selectionEntries?: BSSelectionEntry[];
  selectionEntryGroups?: BSSelectionEntryGroup[];
  infoLinks?: BSInfoLink[];
  entryLinks?: BSEntryLink[];
}

export interface BSSelectionEntryGroup {
  id?: string;
  name: string;
  selectionEntries?: BSSelectionEntry[];
  selectionEntryGroups?: BSSelectionEntryGroup[];
}

export interface BSEntryLink {
  id?: string;
  name: string;
  targetId?: string;
  type?: string;
  costs?: BSCost[];
}

export interface BSCatalogueLink {
  name: string;
  targetId?: string;
  type?: string;
  importRootEntries?: boolean;
}

export interface BSCatalogue {
  name: string;
  id?: string;
  library?: boolean;
  sharedSelectionEntries?: BSSelectionEntry[];
  sharedSelectionEntryGroups?: BSSelectionEntryGroup[];
  sharedRules?: BSSharedRule[];
  catalogueLinks?: BSCatalogueLink[];
  entryLinks?: BSEntryLink[];
}

export interface BSCatalogueFile {
  catalogue: BSCatalogue;
}

export interface LoadedCatalogue {
  filename: string;
  catalogue: BSCatalogue;
}
