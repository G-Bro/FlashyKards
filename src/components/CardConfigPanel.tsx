import type { CardConfig } from '../flashcards/types';
import { DEFAULT_CARD_CONFIG } from '../flashcards/types';
import { exportDeckJson, importDeckJson } from '../storage/local';
import type { DeckState } from '../flashcards/types';

interface CardConfigPanelProps {
  config: CardConfig;
  onChange: (config: CardConfig) => void;
  onGenerate: () => void;
  cardCount: number;
  deck?: DeckState | null;
  onImportDeck?: (deck: DeckState) => void;
}

export function CardConfigPanel({ config, onChange, onGenerate, cardCount, deck, onImportDeck }: CardConfigPanelProps) {
  const toggle = (key: keyof CardConfig) => {
    if (typeof config[key] === 'boolean') {
      onChange({ ...config, [key]: !config[key] });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-zinc-100">Flashcard settings</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Choose what to study. Estimated cards: {cardCount}
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {(
          [
            ['unitStats', 'Unit stats (M/T/Sv/W/LD/OC)'],
            ['unitProfile', 'Full unit profile'],
            ['weaponStats', 'Weapon stats'],
            ['keywords', 'Keywords'],
            ['abilities', 'Abilities'],
            ['detachment', 'Detachment rule'],
            ['enhancements', 'Enhancements'],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-sm text-zinc-200">
            <input
              type="checkbox"
              checked={config[key]}
              onChange={() => toggle(key)}
              className="rounded border-zinc-600"
            />
            {label}
          </label>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange(DEFAULT_CARD_CONFIG)}
          className="rounded-lg border border-zinc-600 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800"
        >
          Reset defaults
        </button>
        <button
          type="button"
          onClick={onGenerate}
          disabled={cardCount === 0}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-40"
        >
          Start quiz ({cardCount} cards)
        </button>
      </div>

      {deck && (
        <div className="flex flex-wrap gap-2 border-t border-zinc-800 pt-4">
          <button
            type="button"
            onClick={() => {
              const blob = new Blob([exportDeckJson(deck)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${deck.name.replace(/\s+/g, '-').toLowerCase()}-deck.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="rounded-lg border border-zinc-600 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800"
          >
            Export deck JSON
          </button>
          {onImportDeck && (
            <label className="cursor-pointer rounded-lg border border-zinc-600 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800">
              Import deck JSON
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const text = await file.text();
                  onImportDeck(importDeckJson(text));
                }}
              />
            </label>
          )}
        </div>
      )}
    </div>
  );
}
