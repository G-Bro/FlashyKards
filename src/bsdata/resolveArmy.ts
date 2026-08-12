import type { ParsedArmy, ResolvedUnit, RosterUnit } from '../parsers/types';
import { fetchCatalogueChain, resolveCatalogueFilename } from './loader';
import { extractDatasheet, extractDetachment, extractEnhancement } from './extractor';
import { getAllUnitEntries, findEntryById, matchUnitName } from './resolver';
import type { CatalogueManifest } from './types';

export interface ArmyResolution {
  catalogues: Awaited<ReturnType<typeof fetchCatalogueChain>>;
  resolvedUnits: ResolvedUnit[];
  detachment?: ReturnType<typeof extractDetachment>;
  enhancements: NonNullable<ReturnType<typeof extractEnhancement>>[];
}

export async function resolveArmy(
  army: ParsedArmy,
  manifest: CatalogueManifest,
  manualOverrides: Record<string, string> = {},
): Promise<ArmyResolution> {
  const filename = resolveCatalogueFilename(
    army.roster.catalogueName,
    army.roster.faction,
    manifest.factionKeywordMap,
  );
  const catalogues = await fetchCatalogueChain(filename.replace(/\.json$/, ''));

  const resolvedUnits: ResolvedUnit[] = army.roster.units.map((unit) =>
    resolveSingleUnit(unit, catalogues, manualOverrides),
  );

  const detachment = army.roster.detachment
    ? extractDetachment(army.roster.detachment, catalogues)
    : undefined;

  const enhancementNames = new Set(
    army.roster.units.map((u) => u.enhancement).filter(Boolean) as string[],
  );
  const enhancements = [...enhancementNames]
    .map((name) => extractEnhancement(name, catalogues))
    .filter((e): e is NonNullable<typeof e> => e !== undefined);

  return { catalogues, resolvedUnits, detachment, enhancements };
}

function resolveSingleUnit(
  unit: RosterUnit,
  catalogues: ArmyResolution['catalogues'],
  manualOverrides: Record<string, string>,
): ResolvedUnit {
  const manualId = manualOverrides[unit.id];
  if (manualId) {
    const entry = findEntryById(manualId, catalogues);
    if (entry) {
      return {
        rosterUnit: unit,
        datasheet: extractDatasheet(entry, catalogues),
        matchStatus: 'manual',
        manualEntryId: manualId,
      };
    }
  }

  const match = matchUnitName(unit.name, catalogues);
  if (match.entry) {
    return {
      rosterUnit: unit,
      datasheet: extractDatasheet(match.entry, catalogues),
      matchStatus:
        match.confidence === 'exact' || match.confidence === 'normalized'
          ? 'matched'
          : match.confidence === 'partial'
            ? 'manual'
            : 'unmatched',
    };
  }

  return {
    rosterUnit: unit,
    datasheet: null,
    matchStatus: 'unmatched',
  };
}

export function getCatalogueUnitOptions(
  catalogues: ArmyResolution['catalogues'],
): Array<{ id: string; name: string }> {
  return getAllUnitEntries(catalogues)
    .filter((e) => e.type === 'unit' || e.type === 'model')
    .map((e) => ({ id: e.id, name: e.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
