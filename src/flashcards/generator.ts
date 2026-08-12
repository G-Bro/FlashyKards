import type { ArmyResolution } from '../bsdata/resolveArmy';
import type { CardConfig, Flashcard, GradingMode } from './types';

const STAT_LABELS: Record<string, string> = {
  M: 'Movement',
  T: 'Toughness',
  Sv: 'Save',
  W: 'Wounds',
  LD: 'Leadership',
  OC: 'Objective Control',
};

function uid(prefix: string, parts: string[]): string {
  return `${prefix}-${parts.join('-')}`.replace(/\s+/g, '_').toLowerCase();
}

/** Strip whitespace, special characters, and optional movement prefix for comparison. */
function normalizeForComparison(value: string): string {
  let normalized = value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '');
  return normalized.replace(/^m(?=\d)/, '');
}

function statValuesEquivalent(expected: string, given: string): boolean {
  return normalizeForComparison(expected) === normalizeForComparison(given);
}

export function gradeAnswer(expected: string, given: string, mode: GradingMode): boolean {
  if (mode === 'self') return true;
  return statValuesEquivalent(expected, given);
}

export function generateFlashcards(
  resolution: ArmyResolution,
  army: { roster: { detachment: string }; detachment?: { name: string; description: string } },
  config: CardConfig,
): Flashcard[] {
  const cards: Flashcard[] = [];

  for (const resolved of resolution.resolvedUnits) {
    const ds = resolved.datasheet;
    if (!ds) continue;
    const unitName = ds.name;

    if (config.unitStats) {
      for (const field of config.statFields) {
        const value = ds.stats[field];
        if (!value) continue;
        cards.push({
          id: uid('stat', [ds.id, field]),
          type: 'unit-stat',
          front: `${unitName}\n${STAT_LABELS[field] ?? field}`,
          back: value,
          unitId: resolved.rosterUnit.id,
          gradingMode: 'auto',
          meta: { field, unitName },
        });
      }
    }

    if (config.unitProfile) {
      const line = ['M', 'T', 'Sv', 'W', 'LD', 'OC']
        .map((f) => `${f} ${ds.stats[f as keyof typeof ds.stats] ?? '-'}`)
        .join('  ');
      cards.push({
        id: uid('profile', [ds.id]),
        type: 'unit-profile',
        front: unitName,
        back: line,
        unitId: resolved.rosterUnit.id,
        gradingMode: 'self',
      });
    }

    if (config.weaponStats) {
      const allWeapons = [
        ...ds.rangedWeapons.map((w) => ({ ...w, kind: 'Ranged' as const })),
        ...ds.meleeWeapons.map((w) => ({ ...w, kind: 'Melee' as const })),
      ];
      for (const weapon of allWeapons) {
        const weaponLabel = `${unitName} — ${weapon.name} (${weapon.kind})`;
        const fieldMap: Record<string, string | undefined> = {
          Range: weapon.range,
          A: weapon.attacks,
          'BS/WS': weapon.skill,
          S: weapon.strength,
          AP: weapon.ap,
          D: weapon.damage,
        };
        for (const field of config.weaponStatFields) {
          const value = fieldMap[field];
          if (!value) continue;
          const mode: GradingMode = field === 'D' && /d\d/i.test(value) ? 'pattern' : 'auto';
          cards.push({
            id: uid('wpn', [ds.id, weapon.name, field]),
            type: 'weapon-stat',
            front: `${weaponLabel}\n${field}`,
            back: value,
            unitId: resolved.rosterUnit.id,
            gradingMode: mode,
          });
        }
      }
    }

    if (config.keywords && ds.keywords.length) {
      cards.push({
        id: uid('kw', [ds.id]),
        type: 'keywords',
        front: `${unitName}\nKeywords`,
        back: ds.keywords.join(', '),
        unitId: resolved.rosterUnit.id,
        gradingMode: 'self',
      });
    }

    if (config.abilities) {
      for (const ability of ds.abilities) {
        if (!ability.description) continue;
        cards.push({
          id: uid('abl', [ds.id, ability.name]),
          type: 'ability',
          front: `${unitName}\n${ability.name}`,
          back: ability.description,
          unitId: resolved.rosterUnit.id,
          gradingMode: 'self',
        });
      }
    }
  }

  if (config.detachment && army.detachment?.description) {
    cards.push({
      id: uid('det', [army.detachment.name]),
      type: 'detachment',
      front: `${army.detachment.name}\nDetachment Rule`,
      back: army.detachment.description,
      gradingMode: 'self',
    });
  }

  if (config.enhancements) {
    for (const enh of resolution.enhancements) {
      if (!enh.description) continue;
      cards.push({
        id: uid('enh', [enh.name]),
        type: 'enhancement',
        front: `${enh.name}\nEnhancement`,
        back: enh.description,
        gradingMode: 'self',
      });
    }
  }

  return shuffle(cards);
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function createDeckState(name: string, cards: Flashcard[]): import('./types').DeckState {
  return {
    id: crypto.randomUUID(),
    name,
    createdAt: new Date().toISOString(),
    cards,
    incorrectIds: [],
    completedIds: [],
    currentIndex: 0,
    phase: 'first-pass',
  };
}

export function getActiveCard(deck: import('./types').DeckState): Flashcard | null {
  const remaining = deck.cards.filter(
    (c) => !deck.completedIds.includes(c.id) || deck.incorrectIds.includes(c.id),
  );
  if (deck.phase === 'first-pass') {
    const incomplete = deck.cards.filter((c) => !deck.completedIds.includes(c.id));
    return incomplete[deck.currentIndex] ?? null;
  }
  const review = remaining.filter((c) => deck.incorrectIds.includes(c.id));
  return review[deck.currentIndex] ?? null;
}

export function markCardResult(
  deck: import('./types').DeckState,
  cardId: string,
  correct: boolean,
): import('./types').DeckState {
  const completedIds = deck.completedIds.includes(cardId)
    ? deck.completedIds
    : [...deck.completedIds, cardId];

  let incorrectIds = [...deck.incorrectIds];
  if (correct) {
    incorrectIds = incorrectIds.filter((id) => id !== cardId);
  } else if (!incorrectIds.includes(cardId)) {
    incorrectIds.push(cardId);
  }

  const nextIndex = deck.currentIndex + 1;
  const firstPassDone = deck.phase === 'first-pass' && nextIndex >= deck.cards.length;
  const reviewCards = deck.cards.filter((c) => incorrectIds.includes(c.id));
  const reviewDone = deck.phase === 'review' && nextIndex >= reviewCards.length;

  if (firstPassDone && incorrectIds.length > 0) {
    return {
      ...deck,
      completedIds,
      incorrectIds,
      currentIndex: 0,
      phase: 'review',
    };
  }

  if (firstPassDone || reviewDone) {
    return {
      ...deck,
      completedIds,
      incorrectIds,
      currentIndex: deck.currentIndex,
      phase: reviewDone ? 'review' : deck.phase,
    };
  }

  return {
    ...deck,
    completedIds,
    incorrectIds,
    currentIndex: nextIndex,
  };
}

export function isDeckComplete(deck: import('./types').DeckState): boolean {
  if (deck.incorrectIds.length > 0) return false;
  return deck.completedIds.length >= deck.cards.length;
}
