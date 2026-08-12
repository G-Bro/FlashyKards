import { parseGwText, isGwTextExport, isNewRecruitJson } from './gw-text';
import { parseNewRecruitJson } from './newrecruit';
import type { ParsedArmy } from './types';

export function parseListInput(text: string): ParsedArmy {
  const trimmed = text.trim();
  if (isNewRecruitJson(trimmed)) {
    return parseNewRecruitJson(JSON.parse(trimmed));
  }
  if (isGwTextExport(trimmed)) {
    return parseGwText(trimmed);
  }
  throw new Error('Unrecognised list format. Paste GW app text or upload NewRecruit JSON.');
}

export function detectAndParseList(raw: string | unknown): ParsedArmy {
  if (typeof raw === 'string') {
    return parseListInput(raw);
  }
  return parseNewRecruitJson(raw);
}

export { parseGwText, isGwTextExport, isNewRecruitJson } from './gw-text';
export { parseNewRecruitJson } from './newrecruit';
export type * from './types';
