export type MoodDisplayConfig = { label: string; className: string; icon: string };

/**
 * The only guest moods the product recognises. Mirrors src/common/moods.ts in
 * the backend — keep the two lists in sync.
 */
export const MOODS = ['Happy', 'Neutral', 'Frustrated', 'Disappointed', 'Concerned'] as const;

export type Mood = (typeof MOODS)[number];

export const DEFAULT_MOOD: Mood = 'Neutral';

export const MOOD_CONFIGS: Record<Mood, MoodDisplayConfig> = {
  Happy: {
    label: 'Happy',
    className:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/45 dark:text-emerald-300 dark:border-emerald-800/70',
    icon: '😊',
  },
  Neutral: {
    label: 'Neutral',
    className:
      'bg-gray-50 text-gray-700 border-gray-200 dark:bg-muted dark:text-neutral-300 dark:border-border',
    icon: '😐',
  },
  Frustrated: {
    label: 'Frustrated',
    className:
      'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/45 dark:text-orange-300 dark:border-orange-800/70',
    icon: '😤',
  },
  Disappointed: {
    label: 'Disappointed',
    className:
      'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/45 dark:text-red-300 dark:border-red-800/70',
    icon: '😞',
  },
  Concerned: {
    label: 'Concerned',
    className:
      'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-800/70',
    icon: '😟',
  },
};

/**
 * Conversations analysed before the vocabulary was fixed still carry values
 * like "excited" or "apologetic", so map the known ones onto the five rather
 * than showing a sixth label. Anything unrecognised reads as Neutral.
 */
const SYNONYMS: Record<string, Mood> = {
  happy: 'Happy',
  excited: 'Happy',
  satisfied: 'Happy',
  pleased: 'Happy',
  grateful: 'Happy',
  appreciative: 'Happy',
  thankful: 'Happy',
  relieved: 'Happy',
  positive: 'Happy',
  friendly: 'Happy',
  hopeful: 'Happy',
  delighted: 'Happy',
  enthusiastic: 'Happy',

  neutral: 'Neutral',
  polite: 'Neutral',
  professional: 'Neutral',
  cooperative: 'Neutral',
  curious: 'Neutral',
  inquisitive: 'Neutral',
  interested: 'Neutral',
  respectful: 'Neutral',
  patient: 'Neutral',
  calm: 'Neutral',
  informative: 'Neutral',
  planning: 'Neutral',
  apologetic: 'Neutral',

  frustrated: 'Frustrated',
  angry: 'Frustrated',
  annoyed: 'Frustrated',
  irritated: 'Frustrated',
  upset: 'Frustrated',
  impatient: 'Frustrated',

  disappointed: 'Disappointed',
  dissatisfied: 'Disappointed',
  unhappy: 'Disappointed',
  sad: 'Disappointed',
  unsatisfied: 'Disappointed',

  concerned: 'Concerned',
  anxious: 'Concerned',
  worried: 'Concerned',
  nervous: 'Concerned',
  uneasy: 'Concerned',
  stressed: 'Concerned',
  confused: 'Concerned',
  uncertain: 'Concerned',
};

/** Coerce any stored mood string to one of the five. */
export function normalizeMood(raw: string | null | undefined): Mood | null {
  if (!raw) return null;

  const key = raw.trim().toLowerCase();
  if (!key) return null;

  const exact = SYNONYMS[key];
  if (exact) return exact;

  for (const [synonym, mood] of Object.entries(SYNONYMS)) {
    if (key.includes(synonym)) return mood;
  }

  return DEFAULT_MOOD;
}

export function getMoodConfig(mood: string | null): MoodDisplayConfig | null {
  const normalized = normalizeMood(mood);
  return normalized ? MOOD_CONFIGS[normalized] : null;
}
