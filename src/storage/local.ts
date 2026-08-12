import type { DeckState } from '../flashcards/types';
import type { ParsedArmy } from '../parsers/types';

const DECK_KEY = 'flashykards-deck';
const ARMY_KEY = 'flashykards-army';

export function saveDeck(deck: DeckState): void {
  localStorage.setItem(DECK_KEY, JSON.stringify(deck));
}

export function loadDeck(): DeckState | null {
  const raw = localStorage.getItem(DECK_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DeckState;
  } catch {
    return null;
  }
}

export function clearDeck(): void {
  localStorage.removeItem(DECK_KEY);
}

export function saveArmy(army: ParsedArmy): void {
  localStorage.setItem(ARMY_KEY, JSON.stringify(army));
}

export function loadArmy(): ParsedArmy | null {
  const raw = localStorage.getItem(ARMY_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ParsedArmy;
  } catch {
    return null;
  }
}

export function exportDeckJson(deck: DeckState): string {
  return JSON.stringify(deck, null, 2);
}

export function importDeckJson(raw: string): DeckState {
  return JSON.parse(raw) as DeckState;
}
