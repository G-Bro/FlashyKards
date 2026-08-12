import type { CSSProperties } from 'react';
import type { RosterUnit, StatBlock } from '../parsers/types';
import type { AttachedGroup, ListSummary } from '../roster/groupAttachments';
import {
  formatStatValue,
  formatUnitLabel,
  STAT_TABLE_COLUMNS,
  statBlocksForUnitIds,
} from '../roster/unitDisplay';
import type { FactionTheme } from '../themes/factions';
import { getDispositionTheme } from '../themes/dispositions';

interface ListOverviewCardProps {
  summary: ListSummary;
  unitAbilityTags?: Record<string, string[]>;
  unitStatBlocks?: Record<string, StatBlock[]>;
  showStats?: boolean;
  forExport?: boolean;
}

interface TableEntry {
  key: string;
  name: string;
  enhancements: string[];
  statBlocks: StatBlock[];
  tags: string[];
}

function EnhancementLine({ name, theme }: { name: string; theme: FactionTheme }) {
  return (
    <p className="text-xs italic text-zinc-600">
      <span
        className="mr-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold not-italic uppercase tracking-wide"
        style={{ background: theme.secondary, color: theme.text }}
      >
        Enhancement:
      </span>
      {name}
    </p>
  );
}

function DispositionTag({ name }: { name: string }) {
  const dispositionTheme = getDispositionTheme(name);
  if (!dispositionTheme) {
    return (
      <span className="shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
        {name}
      </span>
    );
  }

  return (
    <span
      className="shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style={{ background: dispositionTheme.background, color: dispositionTheme.text }}
    >
      {dispositionTheme.id}
    </span>
  );
}

function AbilityTags({ tags, theme }: { tags: string[]; theme: FactionTheme }) {
  if (tags.length === 0) return null;

  return (
    <div className="flex shrink-0 flex-wrap justify-end gap-1">
      {tags.map((tag) => (
        <span
          key={tag}
          className="rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide"
          style={{ background: `${theme.primary}22`, color: theme.primary }}
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

function tagsForUnits(unitIds: string[], unitAbilityTags?: Record<string, string[]>): string[] {
  if (!unitAbilityTags) return [];
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const id of unitIds) {
    for (const tag of unitAbilityTags[id] ?? []) {
      if (!seen.has(tag)) {
        seen.add(tag);
        tags.push(tag);
      }
    }
  }
  return tags;
}

function formatCharacterLabel(unit: RosterUnit): string {
  const count = unit.modelCount > 1 ? `${unit.modelCount}x ` : '';
  const warlord = unit.isWarlord ? ' ★' : '';
  return `${count}${unit.name}${warlord}`;
}

function formatAttachedGroupLabel(group: AttachedGroup): string {
  const characters = [...group.leaders, ...group.supports];
  const leaderPart = characters.map((u) => formatCharacterLabel(u)).join(' + ');
  const bodyguardPart = group.bodyguards.map((u) => formatUnitLabel(u)).join(', ');

  if (leaderPart && bodyguardPart) return `${leaderPart} → ${bodyguardPart}`;
  return leaderPart || bodyguardPart;
}

function unitTableEntry(
  unit: RosterUnit,
  unitAbilityTags?: Record<string, string[]>,
  unitStatBlocks?: Record<string, StatBlock[]>,
): TableEntry {
  return {
    key: unit.id,
    name: formatUnitLabel(unit),
    enhancements: unit.enhancement ? [unit.enhancement] : [],
    statBlocks: statBlocksForUnitIds([unit.id], unitStatBlocks ?? {}),
    tags: unitAbilityTags?.[unit.id] ?? [],
  };
}

function attachedGroupTableEntry(
  group: AttachedGroup,
  unitAbilityTags?: Record<string, string[]>,
  unitStatBlocks?: Record<string, StatBlock[]>,
): TableEntry {
  const allUnits = [...group.leaders, ...group.supports, ...group.bodyguards];
  return {
    key: group.id,
    name: formatAttachedGroupLabel(group),
    enhancements: allUnits.flatMap((u) => (u.enhancement ? [u.enhancement] : [])),
    statBlocks: statBlocksForUnitIds(
      allUnits.map((u) => u.id),
      unitStatBlocks ?? {},
    ),
    tags: tagsForUnits(
      allUnits.map((u) => u.id),
      unitAbilityTags,
    ),
  };
}

function UnitBlock({
  unit,
  theme,
  unitAbilityTags,
}: {
  unit: RosterUnit;
  theme: FactionTheme;
  unitAbilityTags?: Record<string, string[]>;
}) {
  const tags = unitAbilityTags?.[unit.id] ?? [];

  return (
    <li className="space-y-0.5">
      <div className="flex items-start justify-between gap-3">
        <span className="min-w-0">{formatUnitLabel(unit)}</span>
        <AbilityTags tags={tags} theme={theme} />
      </div>
      {unit.enhancement && <EnhancementLine name={unit.enhancement} theme={theme} />}
    </li>
  );
}

function AttachedGroupBlock({
  group,
  theme,
  unitAbilityTags,
}: {
  group: AttachedGroup;
  theme: FactionTheme;
  unitAbilityTags?: Record<string, string[]>;
}) {
  const characters = [...group.leaders, ...group.supports];
  const enhancedUnits = [...characters, ...group.bodyguards].filter((u) => u.enhancement);
  const allUnits = [...characters, ...group.bodyguards];
  const groupTags = tagsForUnits(
    allUnits.map((u) => u.id),
    unitAbilityTags,
  );

  return (
    <li className="space-y-1">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
          {characters.map((u, i) => (
            <span key={u.id} className="font-medium">
              {i > 0 && <span className="font-normal text-zinc-500"> + </span>}
              {formatCharacterLabel(u)}
            </span>
          ))}
          {characters.length > 0 && group.bodyguards.length > 0 && (
            <span style={{ color: theme.accent }} aria-hidden>
              →
            </span>
          )}
          {group.bodyguards.map((u, i) => (
            <span key={u.id}>
              {i > 0 && ', '}
              {formatUnitLabel(u)}
            </span>
          ))}
        </div>
        <AbilityTags tags={groupTags} theme={theme} />
      </div>
      {enhancedUnits.map((u) => (
        <EnhancementLine key={u.id} name={u.enhancement!} theme={theme} />
      ))}
    </li>
  );
}

function StatsTableSection({
  title,
  entries,
  theme,
}: {
  title?: string;
  entries: TableEntry[];
  theme: FactionTheme;
}) {
  if (entries.length === 0) return null;

  return (
    <>
      {title && (
        <tr>
          <td
            colSpan={STAT_TABLE_COLUMNS.length + 1}
            className="pb-1 pt-3 text-xs font-bold uppercase tracking-wide"
            style={{ color: theme.primary }}
          >
            {title}
          </td>
        </tr>
      )}
      {entries.flatMap((entry) => {
        const rows = [];
        const blocks = entry.statBlocks.length > 0 ? entry.statBlocks : [{ label: entry.name, stats: {} }];

        blocks.forEach((block, index) => {
          rows.push(
            <tr key={`${entry.key}-${index}`} className="border-t border-zinc-200/80">
              <td className="py-2 pr-4 align-top text-left font-medium leading-snug">
                {index === 0 ? (
                  <div className="space-y-0.5">
                    <span>{entry.name}</span>
                    {entry.enhancements.map((enhancement) => (
                      <p key={enhancement} className="text-xs font-normal italic text-zinc-500">
                        + {enhancement}
                      </p>
                    ))}
                  </div>
                ) : (
                  <span className="pl-2 text-xs font-normal text-zinc-500">{block.label}</span>
                )}
              </td>
              {STAT_TABLE_COLUMNS.map(({ key }) => (
                <td
                  key={key}
                  className="px-2 py-2 text-right align-top text-sm font-semibold tabular-nums text-zinc-800"
                >
                  {formatStatValue(block.stats, key)}
                </td>
              ))}
            </tr>,
          );
        });

        if (entry.tags.length > 0) {
          rows.push(
            <tr key={`${entry.key}-tags`} className="border-b border-zinc-200/80">
              <td className="pb-2 pr-4 text-left text-xs text-zinc-400">—</td>
              <td
                colSpan={STAT_TABLE_COLUMNS.length}
                className="pb-2 text-right text-xs font-medium uppercase tracking-wide text-zinc-500"
              >
                {entry.tags.join(' · ')}
              </td>
            </tr>,
          );
        }

        return rows;
      })}
    </>
  );
}

function StatsTableBody({
  summary,
  unitAbilityTags,
  unitStatBlocks,
  theme,
}: {
  summary: ListSummary;
  unitAbilityTags?: Record<string, string[]>;
  unitStatBlocks?: Record<string, StatBlock[]>;
  theme: FactionTheme;
}) {
  const attachedEntries = summary.attachedGroups.map((group) =>
    attachedGroupTableEntry(group, unitAbilityTags, unitStatBlocks),
  );
  const otherEntries = [...summary.standaloneCharacters, ...summary.otherUnits].map((unit) =>
    unitTableEntry(unit, unitAbilityTags, unitStatBlocks),
  );

  return (
    <div className="overflow-x-auto px-5 py-4">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-zinc-300">
            <th className="pb-2 pr-4 text-left text-xs font-bold uppercase tracking-wide text-zinc-500">
              Unit
            </th>
            {STAT_TABLE_COLUMNS.map(({ key, label }) => (
              <th
                key={key}
                className="px-2 pb-2 text-right text-xs font-bold uppercase tracking-wide text-zinc-500"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <StatsTableSection entries={attachedEntries} theme={theme} title="Attached units" />
          <StatsTableSection
            entries={otherEntries}
            theme={theme}
            title={attachedEntries.length > 0 ? 'Other units' : undefined}
          />
        </tbody>
      </table>
    </div>
  );
}

function CompactListBody({
  summary,
  unitAbilityTags,
  theme,
}: {
  summary: ListSummary;
  unitAbilityTags?: Record<string, string[]>;
  theme: FactionTheme;
}) {
  const { attachedGroups, standaloneCharacters, otherUnits } = summary;

  return (
    <div className="space-y-4 px-5 py-4 text-sm">
      {attachedGroups.length > 0 && (
        <section>
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: theme.primary }}>
            Attached units
          </h4>
          <ul className="space-y-3">
            {attachedGroups.map((group) => (
              <AttachedGroupBlock key={group.id} group={group} theme={theme} unitAbilityTags={unitAbilityTags} />
            ))}
          </ul>
        </section>
      )}

      {standaloneCharacters.length > 0 && (
        <section>
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: theme.primary }}>
            Characters
          </h4>
          <ul className="space-y-2">
            {standaloneCharacters.map((u) => (
              <UnitBlock key={u.id} unit={u} theme={theme} unitAbilityTags={unitAbilityTags} />
            ))}
          </ul>
        </section>
      )}

      {otherUnits.length > 0 && (
        <section>
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: theme.primary }}>
            Other units
          </h4>
          <ul className="space-y-2">
            {otherUnits.map((u) => (
              <UnitBlock key={u.id} unit={u} theme={theme} unitAbilityTags={unitAbilityTags} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export function ListOverviewCard({
  summary,
  unitAbilityTags,
  unitStatBlocks,
  showStats = false,
  forExport = false,
}: ListOverviewCardProps) {
  const { roster, theme } = summary;
  const style = themeVars(theme);
  const cardWidth = showStats ? 'w-[780px]' : forExport ? 'w-[540px]' : 'w-full max-w-lg';

  return (
    <div className={cardWidth} style={style} data-export-card>
      <div
        className="overflow-hidden rounded-xl border shadow-xl"
        style={{ borderColor: theme.primary, background: '#fafafa', color: '#1a1a1a' }}
      >
        <div className="px-5 py-4" style={{ background: theme.primary, color: theme.text }}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-widest opacity-80">
                {roster.subfaction ? `${roster.faction}` : roster.faction}
              </p>
              <h3 className="text-lg font-bold leading-tight">{roster.name}</h3>
            </div>
            <p className="shrink-0 text-xl font-bold">{roster.points}pts</p>
          </div>
          {(roster.detachment || roster.forceDisposition) && (
            <div className="mt-1 flex w-full items-center justify-between gap-3">
              {roster.detachment ? (
                <p className="min-w-0 text-sm opacity-90">{roster.detachment}</p>
              ) : (
                <span />
              )}
              {roster.forceDisposition && <DispositionTag name={roster.forceDisposition} />}
            </div>
          )}
        </div>

        {showStats ? (
          <StatsTableBody
            summary={summary}
            unitAbilityTags={unitAbilityTags}
            unitStatBlocks={unitStatBlocks}
            theme={theme}
          />
        ) : (
          <CompactListBody summary={summary} unitAbilityTags={unitAbilityTags} theme={theme} />
        )}

        <div
          className="px-5 py-2 text-center text-xs"
          style={{ background: theme.secondary, color: theme.text }}
        >
          flashykards · list summary
        </div>
      </div>
    </div>
  );
}

function themeVars(theme: FactionTheme): CSSProperties {
  return {
    ['--theme-primary' as string]: theme.primary,
    ['--theme-secondary' as string]: theme.secondary,
    ['--theme-accent' as string]: theme.accent,
  };
}
