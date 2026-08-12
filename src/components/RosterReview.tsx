import { useMemo, useRef, useState } from 'react';
import type { ArmyResolution } from '../bsdata/resolveArmy';
import { getCatalogueUnitOptions } from '../bsdata/resolveArmy';
import type { ParsedArmy, StatBlock } from '../parsers/types';
import { buildListSummary } from '../roster/groupAttachments';
import { getAbilityTagsFromDatasheet } from '../roster/unitDisplay';
import { copyElementToClipboard, exportElementToPng, shareElement } from '../export/imageExport';
import { ListOverviewCard } from './ListOverviewCard';

interface RosterReviewProps {
  army: ParsedArmy;
  resolution: ArmyResolution | null;
  loading: boolean;
  error: string | null;
  manualOverrides: Record<string, string>;
  onManualOverride: (unitId: string, entryId: string) => void;
  onStartQuiz: () => void;
}

export function RosterReview({
  army,
  resolution,
  loading,
  error,
  manualOverrides,
  onManualOverride,
  onStartQuiz,
}: RosterReviewProps) {
  const exportRef = useRef<HTMLDivElement>(null);
  const [exportMsg, setExportMsg] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);
  const summary = buildListSummary(army.roster);
  const unitOptions = resolution ? getCatalogueUnitOptions(resolution.catalogues) : [];

  const unitAbilityTags = useMemo(() => {
    if (!resolution) return {};
    const map: Record<string, string[]> = {};
    for (const resolved of resolution.resolvedUnits) {
      if (!resolved.datasheet) continue;
      const tags = getAbilityTagsFromDatasheet(
        resolved.datasheet.keywords,
        resolved.datasheet.abilities.map((a) => a.name),
      );
      if (tags.length > 0) {
        map[resolved.rosterUnit.id] = tags;
      }
    }
    return map;
  }, [resolution]);

  const unitStatBlocks = useMemo(() => {
    if (!resolution) return {};
    const map: Record<string, StatBlock[]> = {};
    for (const resolved of resolution.resolvedUnits) {
      if (!resolved.datasheet?.statBlocks.length) continue;
      map[resolved.rosterUnit.id] = resolved.datasheet.statBlocks;
    }
    return map;
  }, [resolution]);

  const handleExport = async () => {
    const el = exportRef.current?.querySelector('[data-export-card]') as HTMLElement | null;
    if (!el) return;
    await exportElementToPng(el, `${army.roster.name.replace(/\s+/g, '-').toLowerCase()}-summary.png`);
    setExportMsg('Image downloaded.');
  };

  const handleCopy = async () => {
    const el = exportRef.current?.querySelector('[data-export-card]') as HTMLElement | null;
    if (!el) return;
    const ok = await copyElementToClipboard(el);
    setExportMsg(ok ? 'Copied to clipboard.' : 'Clipboard copy not supported.');
  };

  const handleShare = async () => {
    const el = exportRef.current?.querySelector('[data-export-card]') as HTMLElement | null;
    if (!el) return;
    const ok = await shareElement(el, army.roster.name);
    setExportMsg(ok ? 'Shared.' : 'Share not available — try download instead.');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-100">Review army</h2>
        <p className="mt-1 text-sm text-zinc-400">
          {army.roster.faction} · {army.roster.detachment || 'No detachment'} · {army.roster.points} pts
        </p>
      </div>

      {loading && (
        <p className="text-sm text-amber-400">Loading BSData catalogue and matching units…</p>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="overflow-x-auto rounded-lg border border-zinc-700">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-800 text-zinc-300">
            <tr>
              <th className="px-3 py-2">Unit</th>
              <th className="px-3 py-2">Pts</th>
              <th className="px-3 py-2">Match</th>
              <th className="px-3 py-2">Fix</th>
            </tr>
          </thead>
          <tbody>
            {army.roster.units.map((unit) => {
              const resolved = resolution?.resolvedUnits.find((r) => r.rosterUnit.id === unit.id);
              const status = resolved?.matchStatus ?? 'unmatched';
              const statusColor =
                status === 'matched'
                  ? 'text-green-400'
                  : status === 'manual'
                    ? 'text-amber-400'
                    : 'text-red-400';

              return (
                <tr key={unit.id} className="border-t border-zinc-800 text-zinc-200">
                  <td className="px-3 py-2">
                    {unit.name}
                    {unit.isWarlord && ' ★'}
                    {unit.enhancement && (
                      <span className="ml-1 text-xs text-zinc-500">+ {unit.enhancement}</span>
                    )}
                  </td>
                  <td className="px-3 py-2">{unit.points}</td>
                  <td className={`px-3 py-2 ${statusColor}`}>{status}</td>
                  <td className="px-3 py-2">
                    {status === 'unmatched' && unitOptions.length > 0 && (
                      <select
                        className="max-w-[180px] rounded border border-zinc-600 bg-zinc-900 px-2 py-1 text-xs"
                        value={manualOverrides[unit.id] ?? ''}
                        onChange={(e) => onManualOverride(unit.id, e.target.value)}
                      >
                        <option value="">Pick unit…</option>
                        {unitOptions.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-zinc-300">List overview preview</h3>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-400">
            <input
              type="checkbox"
              checked={showStats}
              onChange={(e) => setShowStats(e.target.checked)}
              className="rounded border-zinc-600 bg-zinc-900"
            />
            Show unit stats
          </label>
        </div>
        <div ref={exportRef} className={showStats ? 'overflow-x-auto' : undefined}>
          <ListOverviewCard
            summary={summary}
            unitAbilityTags={unitAbilityTags}
            unitStatBlocks={unitStatBlocks}
            showStats={showStats}
            forExport
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void handleExport()}
            className="rounded-lg border border-zinc-600 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-800"
          >
            Download PNG
          </button>
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="rounded-lg border border-zinc-600 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-800"
          >
            Copy image
          </button>
          <button
            type="button"
            onClick={() => void handleShare()}
            className="rounded-lg border border-zinc-600 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-800"
          >
            Share
          </button>
        </div>
        {exportMsg && <p className="text-xs text-zinc-500">{exportMsg}</p>}
      </div>

      <button
        type="button"
        onClick={onStartQuiz}
        disabled={!resolution || loading}
        className="rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-40"
      >
        Configure flashcards
      </button>
    </div>
  );
}
