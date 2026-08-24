'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, AtSign, Users } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export interface MentionCandidate {
  id: string;
  label: string;
  hint?: string;
  kind: 'user' | 'assistant' | 'everyone';
}

interface MentionComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  candidates: MentionCandidate[];
  placeholder?: string;
  disabled?: boolean;
}

/** Longest sensible mention query — display names may contain one space. */
const MAX_QUERY = 24;

function activeQuery(value: string, caret: number): { start: number; query: string } | null {
  const at = value.lastIndexOf('@', caret - 1);
  if (at < 0) return null;

  // Must start a word: preceded by nothing or whitespace.
  if (at > 0 && !/\s/.test(value[at - 1])) return null;

  const query = value.slice(at + 1, caret);
  if (query.length > MAX_QUERY) return null;
  // Allow a single space so "@Sarah K" still matches, but stop at the second.
  if ((query.match(/\s/g) || []).length > 1) return null;
  if (query.includes('\n')) return null;

  return { start: at, query };
}

export default function MentionComposer({
  value,
  onChange,
  onSubmit,
  candidates,
  placeholder,
  disabled,
}: MentionComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [caret, setCaret] = useState(0);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);

  const trigger = useMemo(() => activeQuery(value, caret), [value, caret]);

  const matches = useMemo(() => {
    if (!trigger) return [];
    const query = trigger.query.trim().toLowerCase();
    return candidates
      .filter((candidate) => !query || candidate.label.toLowerCase().includes(query))
      .slice(0, 6);
  }, [trigger, candidates]);

  useEffect(() => {
    setOpen(!!trigger && matches.length > 0);
    setHighlighted(0);
  }, [trigger, matches.length]);

  const insert = (candidate: MentionCandidate) => {
    if (!trigger) return;
    const before = value.slice(0, trigger.start);
    const after = value.slice(caret);
    const next = `${before}@${candidate.label} ${after}`;
    onChange(next);
    setOpen(false);

    const position = before.length + candidate.label.length + 2;
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(position, position);
      setCaret(position);
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (open && matches.length > 0) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setHighlighted((i) => (i + 1) % matches.length);
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setHighlighted((i) => (i - 1 + matches.length) % matches.length);
        return;
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        insert(matches[highlighted]);
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        return;
      }
    }

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
    }
  };

  const syncCaret = (event: { currentTarget: HTMLTextAreaElement }) => {
    setCaret(event.currentTarget.selectionStart ?? 0);
  };

  return (
    <div className="relative flex-1">
      {open && (
        <div className="absolute bottom-full mb-2 left-0 w-72 max-h-60 overflow-y-auto rounded-lg border border-gray-200 dark:border-border bg-white dark:bg-card shadow-lg z-20">
          {matches.map((candidate, index) => {
            const Icon =
              candidate.kind === 'assistant' ? Bot : candidate.kind === 'everyone' ? Users : AtSign;
            return (
              <button
                key={candidate.id}
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  insert(candidate);
                }}
                onMouseEnter={() => setHighlighted(index)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
                  index === highlighted && 'bg-blue-50 dark:bg-muted/60',
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium truncate text-gray-900 dark:text-foreground">
                    {candidate.label}
                  </span>
                  {candidate.hint && (
                    <span className="block text-xs text-gray-500 dark:text-muted-foreground truncate">
                      {candidate.hint}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <Textarea
        ref={textareaRef}
        value={value}
        disabled={disabled}
        onChange={(event) => {
          onChange(event.target.value);
          syncCaret(event);
        }}
        onKeyUp={syncCaret}
        onClick={syncCaret}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="min-h-[44px] max-h-32 resize-none"
        rows={1}
      />
    </div>
  );
}
