import { useState } from 'react';
import type { DeckState, Flashcard } from '../flashcards/types';
import { gradeAnswer, isDeckComplete, markCardResult } from '../flashcards/generator';
import { saveDeck } from '../storage/local';

interface QuizSessionProps {
  deck: DeckState;
  onDeckUpdate: (deck: DeckState) => void;
  onFinish: () => void;
}

export function QuizSession({ deck, onDeckUpdate, onFinish }: QuizSessionProps) {
  const [flipped, setFlipped] = useState(false);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const activeCards =
    deck.phase === 'review'
      ? deck.cards.filter((c) => deck.incorrectIds.includes(c.id))
      : deck.cards.filter((c) => !deck.completedIds.includes(c.id));

  const card: Flashcard | null = activeCards[deck.currentIndex] ?? null;
  const complete = isDeckComplete(deck);

  if (complete) {
    return (
      <div className="space-y-4 text-center">
        <h2 className="text-2xl font-bold text-green-400">All cards correct!</h2>
        <p className="text-zinc-400">You cleared {deck.cards.length} flashcards.</p>
        <button
          type="button"
          onClick={onFinish}
          className="rounded-lg bg-amber-600 px-5 py-2 text-sm font-medium text-white hover:bg-amber-500"
        >
          Back to review
        </button>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="text-center text-zinc-400">
        <p>No cards remaining in this phase.</p>
        <button type="button" onClick={onFinish} className="mt-3 text-amber-400 underline">
          Back
        </button>
      </div>
    );
  }

  const progress = deck.phase === 'review'
    ? `${deck.currentIndex + 1} / ${activeCards.length} (review)`
    : `${deck.completedIds.length + 1} / ${deck.cards.length}`;

  const handleReveal = () => setFlipped(true);

  const handleMark = (correct: boolean) => {
    const updated = markCardResult(deck, card.id, correct);
    saveDeck(updated);
    onDeckUpdate(updated);
    setFlipped(false);
    setAnswer('');
    setFeedback(null);
  };

  const handleSubmit = () => {
    if (card.gradingMode === 'self') {
      setFlipped(true);
      return;
    }
    const correct = gradeAnswer(card.back, answer, card.gradingMode);
    setFeedback(correct ? 'Correct!' : `Incorrect — answer: ${card.back}`);
    if (correct) {
      setTimeout(() => handleMark(true), 800);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="flex items-center justify-between text-sm text-zinc-400">
        <span>{deck.name}</span>
        <span>{progress}</span>
      </div>

      <div
        className="min-h-[220px] cursor-pointer rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-lg"
        onClick={() => !flipped && card.gradingMode === 'self' && handleReveal()}
      >
        {!flipped ? (
          <div>
            <p className="text-xs uppercase tracking-wide text-amber-500">{card.type.replace('-', ' ')}</p>
            <p className="mt-3 whitespace-pre-wrap text-lg font-medium text-zinc-100">{card.front}</p>
          </div>
        ) : (
          <div>
            <p className="text-xs uppercase tracking-wide text-green-500">Answer</p>
            <p className="mt-3 whitespace-pre-wrap text-lg text-zinc-100">{card.back}</p>
          </div>
        )}
      </div>

      {!flipped && card.gradingMode !== 'self' && (
        <div className="flex gap-2">
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Your answer"
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 focus:border-amber-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleSubmit}
            className="rounded-lg bg-zinc-700 px-4 py-2 text-sm text-white hover:bg-zinc-600"
          >
            Check
          </button>
        </div>
      )}

      {!flipped && card.gradingMode === 'self' && (
        <button
          type="button"
          onClick={handleReveal}
          className="w-full rounded-lg bg-zinc-700 py-2 text-sm text-white hover:bg-zinc-600"
        >
          Reveal answer
        </button>
      )}

      {feedback && <p className={`text-sm ${feedback.startsWith('Correct') ? 'text-green-400' : 'text-red-400'}`}>{feedback}</p>}

      {flipped && (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => handleMark(false)}
            className="flex-1 rounded-lg border border-red-800 py-2 text-sm text-red-300 hover:bg-red-950"
          >
            Incorrect
          </button>
          <button
            type="button"
            onClick={() => handleMark(true)}
            className="flex-1 rounded-lg bg-green-700 py-2 text-sm text-white hover:bg-green-600"
          >
            Correct
          </button>
        </div>
      )}

      {!flipped && feedback?.startsWith('Incorrect') && (
        <button
          type="button"
          onClick={() => {
            setFlipped(true);
          }}
          className="text-sm text-amber-400 underline"
        >
          Show answer
        </button>
      )}
    </div>
  );
}
