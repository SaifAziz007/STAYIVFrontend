'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme, type Theme } from './theme-provider';

const CYCLE: Record<Theme, Theme> = { light: 'dark', dark: 'system', system: 'light' };

const ICONS: Record<Theme, React.ReactNode> = {
  light: <Sun className="h-4 w-4" />,
  dark: <Moon className="h-4 w-4" />,
  system: <Monitor className="h-4 w-4" />,
};

const LABELS: Record<Theme, string> = {
  light: 'Switch to dark mode',
  dark: 'Switch to system theme',
  system: 'Switch to light mode',
};

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={() => setTheme(CYCLE[theme])}
      aria-label={LABELS[theme]}
      title={LABELS[theme]}
      className={cn(
        'inline-flex items-center justify-center rounded-lg p-2',
        'text-gray-500 hover:text-gray-700 hover:bg-gray-100',
        'dark:text-muted-foreground dark:hover:text-foreground dark:hover:bg-muted',
        'transition-colors duration-200',
        className,
      )}
    >
      {ICONS[theme]}
    </button>
  );
}
