import type { BSCatalogue, BSCatalogueFile, LoadedCatalogue } from './types';
import { BSDATA_CDN_BASE } from './types';
import { normalizeFactionKey, resolveCatalogueAlias } from './catalogueAliases';

const memoryCache = new Map<string, BSCatalogue>();

function catalogueFilename(name: string): string {
  if (name.endsWith('.json')) return name;
  return `${name}.json`;
}

export async function fetchCatalogue(filename: string): Promise<LoadedCatalogue> {
  const file = catalogueFilename(filename);
  const cached = memoryCache.get(file);
  if (cached) {
    return { filename: file, catalogue: cached };
  }

  const response = await fetch(`${BSDATA_CDN_BASE}/${encodeURIComponent(file)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch catalogue: ${file} (${response.status})`);
  }

  const data = (await response.json()) as BSCatalogueFile;
  memoryCache.set(file, data.catalogue);
  return { filename: file, catalogue: data.catalogue };
}

export async function fetchCatalogueChain(catalogueName: string): Promise<LoadedCatalogue[]> {
  const primary = await fetchCatalogue(catalogueName);
  const loaded = [primary];
  const seen = new Set([primary.filename]);

  const links = primary.catalogue.catalogueLinks ?? [];
  for (const link of links) {
    const linkedName = link.name.endsWith('.json') ? link.name : `${link.name}.json`;
    if (seen.has(linkedName)) continue;
    try {
      const linked = await fetchCatalogue(linkedName);
      loaded.push(linked);
      seen.add(linked.filename);
    } catch {
      // Some linked catalogues may use different naming; skip gracefully.
    }
  }

  return loaded;
}

export function clearCatalogueCache(): void {
  memoryCache.clear();
}

export function resolveCatalogueFilename(
  catalogueName: string,
  factionKeyword: string,
  manifestMap: Record<string, string>,
): string {
  const candidates = [catalogueName, factionKeyword].filter(Boolean);
  for (const candidate of candidates) {
    if (candidate.includes('Unknown')) continue;

    const alias = resolveCatalogueAlias(candidate);
    if (alias) return catalogueFilename(alias);

    const mapped = manifestMap[normalizeFactionKey(candidate)];
    if (mapped) return mapped;
  }

  if (catalogueName && !catalogueName.includes('Unknown')) {
    return catalogueFilename(catalogueName);
  }

  const mapped = manifestMap[normalizeFactionKey(factionKeyword)];
  if (mapped) return mapped;

  return catalogueFilename(catalogueName || factionKeyword);
}
