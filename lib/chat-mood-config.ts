export type MoodDisplayConfig = { label: string; className: string; icon: string };

export function getMoodConfig(mood: string | null): MoodDisplayConfig | null {
  if (!mood) return null;

  const moodLower = mood.toLowerCase().trim();

  const moodConfigs: Record<string, MoodDisplayConfig> = {
    happy: {
      label: 'Happy',
      className:
        'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/45 dark:text-emerald-300 dark:border-emerald-800/70',
      icon: '😊',
    },
    excited: {
      label: 'Excited',
      className:
        'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/45 dark:text-amber-300 dark:border-amber-800/70',
      icon: '🤩',
    },
    satisfied: {
      label: 'Satisfied',
      className:
        'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/45 dark:text-green-300 dark:border-green-800/70',
      icon: '😌',
    },
    pleased: {
      label: 'Pleased',
      className:
        'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/45 dark:text-teal-300 dark:border-teal-800/70',
      icon: '😊',
    },
    grateful: {
      label: 'Grateful',
      className:
        'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/45 dark:text-indigo-300 dark:border-indigo-800/70',
      icon: '🙏',
    },
    neutral: {
      label: 'Neutral',
      className:
        'bg-gray-50 text-gray-700 border-gray-200 dark:bg-muted dark:text-neutral-300 dark:border-border',
      icon: '😐',
    },
    calm: {
      label: 'Calm',
      className:
        'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/45 dark:text-blue-300 dark:border-blue-800/70',
      icon: '😌',
    },
    curious: {
      label: 'Curious',
      className:
        'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/45 dark:text-purple-300 dark:border-purple-800/70',
      icon: '🤔',
    },
    frustrated: {
      label: 'Frustrated',
      className:
        'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/45 dark:text-orange-300 dark:border-orange-800/70',
      icon: '😤',
    },
    disappointed: {
      label: 'Disappointed',
      className:
        'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/45 dark:text-red-300 dark:border-red-800/70',
      icon: '😞',
    },
    concerned: {
      label: 'Concerned',
      className:
        'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-800/70',
      icon: '😟',
    },
    angry: {
      label: 'Angry',
      className:
        'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800/70',
      icon: '😠',
    },
    confused: {
      label: 'Confused',
      className:
        'bg-slate-50 text-slate-700 border-slate-200 dark:bg-muted dark:text-neutral-300 dark:border-border',
      icon: '😕',
    },
    polite: {
      label: 'Polite',
      className:
        'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/45 dark:text-sky-300 dark:border-sky-800/70',
      icon: '🙂',
    },
    professional: {
      label: 'Professional',
      className:
        'bg-slate-50 text-slate-700 border-slate-200 dark:bg-muted dark:text-neutral-300 dark:border-border',
      icon: '💼',
    },
    friendly: {
      label: 'Friendly',
      className:
        'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/45 dark:text-rose-300 dark:border-rose-800/70',
      icon: '😄',
    },
  };

  if (moodLower in moodConfigs) {
    return moodConfigs[moodLower];
  }

  for (const [key, config] of Object.entries(moodConfigs)) {
    if (moodLower.includes(key) || key.includes(moodLower)) {
      return config;
    }
  }

  return {
    label: mood.charAt(0).toUpperCase() + mood.slice(1),
    className:
      'bg-gray-50 text-gray-600 border-gray-200 dark:bg-muted dark:text-muted-foreground dark:border-border',
    icon: '💭',
  };
}
