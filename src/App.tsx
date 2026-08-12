import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ArmyResolution } from './bsdata/resolveArmy';
import { resolveArmy } from './bsdata/resolveArmy';
import type { CatalogueManifest } from './bsdata/types';
import { generateFlashcards, createDeckState } from './flashcards/generator';
import { DEFAULT_CARD_CONFIG, type CardConfig, type DeckState } from './flashcards/types';
import type { ParsedArmy } from './parsers/types';
import { ImportPanel } from './components/ImportPanel';
import { RosterReview } from './components/RosterReview';
import { CardConfigPanel } from './components/CardConfigPanel';
import { QuizSession } from './components/QuizSession';
import { saveArmy, saveDeck, loadDeck } from './storage/local';

type Step = 'import' | 'review' | 'configure' | 'quiz';

export default function App() {
  const [step, setStep] = useState<Step>('import');
  const [army, setArmy] = useState<ParsedArmy | null>(null);
  const [resolution, setResolution] = useState<ArmyResolution | null>(null);
  const [manifest, setManifest] = useState<CatalogueManifest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualOverrides, setManualOverrides] = useState<Record<string, string>>({});
  const [cardConfig, setCardConfig] = useState<CardConfig>(DEFAULT_CARD_CONFIG);
  const [deck, setDeck] = useState<DeckState | null>(() => loadDeck());

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}catalogue-manifest.json`)
      .then((r) => r.json())
      .then((data: CatalogueManifest) => setManifest(data))
      .catch(() => setError('Failed to load catalogue manifest.'));
  }, []);

  const resolveList = useCallback(
    async (parsed: ParsedArmy, overrides: Record<string, string>, m: CatalogueManifest) => {
      setLoading(true);
      setError(null);
      try {
        const result = await resolveArmy(parsed, m, overrides);
        setResolution(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load BSData.');
        setResolution(null);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (army && manifest) {
      void resolveList(army, manualOverrides, manifest);
    }
  }, [army, manualOverrides, manifest, resolveList]);

  const handleImport = (parsed: ParsedArmy) => {
    setArmy(parsed);
    saveArmy(parsed);
    setManualOverrides({});
    setStep('review');
  };

  const handleManualOverride = (unitId: string, entryId: string) => {
    setManualOverrides((prev) => ({ ...prev, [unitId]: entryId }));
  };

  const estimatedCardCount = useMemo(() => {
    if (!resolution || !army) return 0;
    return generateFlashcards(
      resolution,
      { roster: army.roster, detachment: resolution.detachment },
      cardConfig,
    ).length;
  }, [resolution, army, cardConfig]);

  const handleGenerateDeck = () => {
    if (!resolution || !army) return;
    const cards = generateFlashcards(
      resolution,
      { roster: army.roster, detachment: resolution.detachment },
      cardConfig,
    );
    const newDeck = createDeckState(army.roster.name, cards);
    setDeck(newDeck);
    saveDeck(newDeck);
    setStep('quiz');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-900/80 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight">flashykards</h1>
            <p className="text-xs text-zinc-500">WH40K datasheet memorisation</p>
          </div>
          <nav className="flex gap-2 text-xs">
            {(['import', 'review', 'configure', 'quiz'] as Step[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStep(s)}
                disabled={(s === 'review' && !army) || (s === 'configure' && !resolution) || (s === 'quiz' && !deck)}
                className={`rounded px-2 py-1 capitalize ${step === s ? 'bg-amber-600 text-white' : 'text-zinc-400 hover:text-zinc-200 disabled:opacity-30'}`}
              >
                {s}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {step === 'import' && <ImportPanel onImport={handleImport} />}

        {step === 'review' && army && (
          <RosterReview
            army={army}
            resolution={resolution}
            loading={loading}
            error={error}
            manualOverrides={manualOverrides}
            onManualOverride={handleManualOverride}
            onStartQuiz={() => setStep('configure')}
          />
        )}

        {step === 'configure' && (
          <CardConfigPanel
            config={cardConfig}
            onChange={setCardConfig}
            onGenerate={handleGenerateDeck}
            cardCount={estimatedCardCount}
            deck={deck}
            onImportDeck={(d) => {
              setDeck(d);
              saveDeck(d);
              setStep('quiz');
            }}
          />
        )}

        {step === 'quiz' && deck && (
          <QuizSession deck={deck} onDeckUpdate={setDeck} onFinish={() => setStep('review')} />
        )}
      </main>

      <footer className="mx-auto max-w-3xl px-4 pb-8 text-center text-xs text-zinc-600">
        Data from{' '}
        <a
          href="https://github.com/BSData/wh40k-11e"
          className="underline hover:text-zinc-400"
          target="_blank"
          rel="noreferrer"
        >
          BSData/wh40k-11e
        </a>
        . Community-maintained; not endorsed by Games Workshop.
      </footer>
    </div>
  );
}
