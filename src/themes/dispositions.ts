export const FORCE_DISPOSITIONS = [
  'Take and Hold',
  'Purge the Foe',
  'Disruption',
  'Reconnaissance',
  'Priority Assets',
] as const;

export type ForceDisposition = (typeof FORCE_DISPOSITIONS)[number];

export interface DispositionTheme {
  id: ForceDisposition;
  background: string;
  text: string;
}

/** Thematic colours aligned with GW app disposition badges */
export const DISPOSITION_THEMES: Record<ForceDisposition, DispositionTheme> = {
  'Take and Hold': {
    id: 'Take and Hold',
    background: '#2E7D32',
    text: '#FFFFFF',
  },
  'Purge the Foe': {
    id: 'Purge the Foe',
    background: '#C62828',
    text: '#FFFFFF',
  },
  Disruption: {
    id: 'Disruption',
    background: '#6A1B9A',
    text: '#FFFFFF',
  },
  Reconnaissance: {
    id: 'Reconnaissance',
    background: '#0277BD',
    text: '#FFFFFF',
  },
  'Priority Assets': {
    id: 'Priority Assets',
    background: '#F9A825',
    text: '#1A1A1A',
  },
};

export function matchForceDisposition(line: string): ForceDisposition | null {
  const normalized = line.trim().toLowerCase();
  for (const disposition of FORCE_DISPOSITIONS) {
    if (disposition.toLowerCase() === normalized) {
      return disposition;
    }
  }
  return null;
}

export function getDispositionTheme(name: string): DispositionTheme | null {
  const matched = matchForceDisposition(name);
  return matched ? DISPOSITION_THEMES[matched] : null;
}
