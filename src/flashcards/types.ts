export type CardType =
  | 'unit-stat'
  | 'unit-profile'
  | 'weapon-stat'
  | 'keywords'
  | 'ability'
  | 'detachment'
  | 'enhancement';

export type GradingMode = 'auto' | 'pattern' | 'self';

export interface CardConfig {
  unitStats: boolean;
  unitProfile: boolean;
  weaponStats: boolean;
  keywords: boolean;
  abilities: boolean;
  detachment: boolean;
  enhancements: boolean;
  statFields: Array<'M' | 'T' | 'Sv' | 'W' | 'LD' | 'OC'>;
  weaponStatFields: Array<'Range' | 'A' | 'BS/WS' | 'S' | 'AP' | 'D'>;
}

export const DEFAULT_CARD_CONFIG: CardConfig = {
  unitStats: true,
  unitProfile: false,
  weaponStats: true,
  keywords: false,
  abilities: false,
  detachment: true,
  enhancements: true,
  statFields: ['M', 'T', 'Sv', 'W', 'LD', 'OC'],
  weaponStatFields: ['Range', 'A', 'BS/WS', 'S', 'AP', 'D'],
};

export interface Flashcard {
  id: string;
  type: CardType;
  front: string;
  back: string;
  unitId?: string;
  gradingMode: GradingMode;
  meta?: Record<string, string>;
}

export interface DeckState {
  id: string;
  name: string;
  createdAt: string;
  cards: Flashcard[];
  incorrectIds: string[];
  completedIds: string[];
  currentIndex: number;
  phase: 'first-pass' | 'review';
}
