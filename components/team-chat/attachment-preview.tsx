'use client';

import { useEffect, useState } from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';
import { teamChatApi, type TeamAttachment } from '@/lib/team-chat-api';
import { cn } from '@/lib/utils';

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface AttachmentPreviewProps {
  attachment: TeamAttachment;
  inverted?: boolean;
}

/**
 * Attachment bytes are behind the JWT-guarded API, so they can't be used as a
 * plain src. Images and video are fetched into an object URL; anything else
 * renders as a download row.
 */
export default function AttachmentPreview({ attachment, inverted }: AttachmentPreviewProps) {
  const isImage = attachment.mimeType.startsWith('image/');
  const isVideo = attachment.mimeType.startsWith('video/');
  const isMedia = isImage || isVideo;

  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!isMedia) return;

    let objectUrl: string | null = null;
    let cancelled = false;

    setLoading(true);
    teamChatApi
      .fetchAttachmentUrl(attachment.id)
      .then((next) => {
        if (cancelled) {
          URL.revokeObjectURL(next);
          return;
        }
        objectUrl = next;
        setUrl(next);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attachment.id, isMedia]);

  const download = async () => {
    try {
      const objectUrl = url ?? (await teamChatApi.fetchAttachmentUrl(attachment.id));
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = attachment.fileName;
      link.click();
      if (!url) URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error('Failed to download attachment:', error);
    }
  };

  if (isMedia && !failed) {
    return (
      <div className="mt-2 rounded-lg overflow-hidden max-w-xs">
        {loading || !url ? (
          <div className="h-32 flex items-center justify-center bg-black/10 dark:bg-white/10 rounded-lg">
            <Loader2 className="h-5 w-5 animate-spin opacity-60" />
          </div>
        ) : isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={attachment.fileName}
            className="max-h-64 w-auto rounded-lg cursor-pointer"
            onClick={() => void download()}
          />
        ) : (
          <video src={url} controls className="max-h-64 w-full rounded-lg" />
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void download()}
      className={cn(
        'mt-2 w-full max-w-xs flex items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors',
        inverted
          ? 'bg-white/20 hover:bg-white/30'
          : 'bg-gray-200/70 dark:bg-muted-foreground/15 hover:bg-gray-300/70 dark:hover:bg-muted-foreground/25',
      )}
    >
      <FileText className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-medium truncate">{attachment.fileName}</span>
        <span className="block text-[10px] opacity-70">{formatSize(attachment.size)}</span>
      </span>
      <Download className="h-3.5 w-3.5 shrink-0 opacity-70" />
    </button>
  );
}
