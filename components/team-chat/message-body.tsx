'use client';

import { Fragment, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { TeamMessageMention } from '@/lib/team-chat-api';

interface MessageBodyProps {
  body: string;
  mentions: TeamMessageMention[];
  /** Highlight mentions of this user more strongly. */
  currentUserId?: string;
  /** Rendered inside a "mine" bubble, which already has a dark background. */
  inverted?: boolean;
}

interface Segment {
  text: string;
  mention?: TeamMessageMention;
}

/**
 * Renders a message body with its @mentions highlighted. Mentions are matched
 * from the handles the server recorded, so display names containing spaces
 * ("@Sarah Khan") highlight as one unit.
 */
export default function MessageBody({
  body,
  mentions,
  currentUserId,
  inverted,
}: MessageBodyProps) {
  const segments = useMemo<Segment[]>(() => {
    if (!mentions?.length) return [{ text: body }];

    // Longest handle first so "@Sarah Khan" wins over "@Sarah".
    const ordered = [...mentions].sort((a, b) => b.handle.length - a.handle.length);
    const lower = body.toLowerCase();
    const out: Segment[] = [];
    let buffer = '';

    for (let i = 0; i < body.length; ) {
      let matched: TeamMessageMention | null = null;

      if (body[i] === '@') {
        for (const mention of ordered) {
          const handle = mention.handle.toLowerCase();
          if (lower.startsWith(handle, i + 1)) {
            matched = mention;
            break;
          }
        }
      }

      if (matched) {
        if (buffer) {
          out.push({ text: buffer });
          buffer = '';
        }
        out.push({ text: body.slice(i, i + 1 + matched.handle.length), mention: matched });
        i += 1 + matched.handle.length;
      } else {
        buffer += body[i];
        i += 1;
      }
    }

    if (buffer) out.push({ text: buffer });
    return out;
  }, [body, mentions]);

  return (
    <p className="whitespace-pre-wrap break-words">
      {segments.map((segment, index) => {
        if (!segment.mention) return <Fragment key={index}>{segment.text}</Fragment>;

        const isMe =
          segment.mention.kind === 'everyone' ||
          (segment.mention.kind === 'user' && segment.mention.userId === currentUserId);

        return (
          <span
            key={index}
            className={cn(
              'rounded px-1 font-medium',
              inverted
                ? 'bg-white/25 text-white'
                : isMe
                  ? 'bg-amber-200 text-amber-950 dark:bg-amber-500/30 dark:text-amber-200'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-500/25 dark:text-blue-200',
            )}
          >
            {segment.text}
          </span>
        );
      })}
    </p>
  );
}
