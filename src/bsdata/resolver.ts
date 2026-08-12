import type { BSSelectionEntry, LoadedCatalogue } from './types';

/** Apostrophe-like characters from GW exports, BSData, and typography variants. */
const APOSTROPHE_LIKE = /[''`´\u02BC\u2018\u2019]/g;

export function normalizeUnitName(name: string): string {
  return name
    .normalize('NFKD')
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(APOSTROPHE_LIKE, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function collectUnitEntries(entries: BSSelectionEntry[] | undefined, out: BSSelectionEntry[]): void {
  if (!entries) return;
  for (const entry of entries) {
    if (entry.type === 'unit' || entry.type === 'model') {
      out.push(entry);
    }
    collectUnitEntries(entry.selectionEntries, out);
    for (const group of entry.selectionEntryGroups ?? []) {
      collectUnitEntries(group.selectionEntries, out);
    }
  }
}

export function getAllUnitEntries(catalogues: LoadedCatalogue[]): BSSelectionEntry[] {
  const out: BSSelectionEntry[] = [];
  for (const { catalogue } of catalogues) {
    collectUnitEntries(catalogue.sharedSelectionEntries, out);
    for (const group of catalogue.sharedSelectionEntryGroups ?? []) {
      collectUnitEntries(group.selectionEntries, out);
    }
    for (const link of catalogue.entryLinks ?? []) {
      if (link.targetId) {
        out.push({
          id: link.targetId,
          name: link.name,
          type: link.type ?? 'unit',
          costs: link.costs,
        });
      }
    }
  }
  return out;
}

export interface MatchResult {
  entry: BSSelectionEntry | null;
  confidence: 'exact' | 'normalized' | 'partial' | 'none';
}

function entryRichness(entry: BSSelectionEntry): number {
  return (entry.profiles?.length ?? 0) + (entry.selectionEntries?.length ?? 0);
}

function preferRicherEntry(
  current: BSSelectionEntry | undefined,
  candidate: BSSelectionEntry,
): BSSelectionEntry {
  if (!current) return candidate;
  return entryRichness(candidate) > entryRichness(current) ? candidate : current;
}

export function matchUnitName(
  unitName: string,
  catalogues: LoadedCatalogue[],
): MatchResult {
  const entries = getAllUnitEntries(catalogues);
  const normalized = normalizeUnitName(unitName);

  let exact: BSSelectionEntry | undefined;
  let normalizedMatch: BSSelectionEntry | undefined;
  let partial: BSSelectionEntry | undefined;

  for (const entry of entries) {
    if (entry.name === unitName) {
      exact = preferRicherEntry(exact, entry);
    }
    if (normalizeUnitName(entry.name) === normalized) {
      normalizedMatch = preferRicherEntry(normalizedMatch, entry);
    }
    const entryNormalized = normalizeUnitName(entry.name);
    if (
      entryNormalized.includes(normalized) ||
      normalized.includes(entryNormalized)
    ) {
      partial = preferRicherEntry(partial, entry);
    }
  }

  if (exact) return { entry: exact, confidence: 'exact' };
  if (normalizedMatch) return { entry: normalizedMatch, confidence: 'normalized' };
  if (partial) return { entry: partial, confidence: 'partial' };

  return { entry: null, confidence: 'none' };
}

export function findEntryById(
  entryId: string,
  catalogues: LoadedCatalogue[],
): BSSelectionEntry | null {
  const entries = getAllUnitEntries(catalogues);
  return entries.find((e) => e.id === entryId) ?? null;
}
