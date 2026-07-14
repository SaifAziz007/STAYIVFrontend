'use client';

import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { SyncJob, SyncCounts, SyncPhase } from '@/lib/conversations-api';

const PHASE_META: Record<SyncPhase, { label: string; percent: number }> = {
  starting: { label: 'Starting sync…', percent: 5 },
  properties: { label: 'Syncing properties…', percent: 15 },
  reservations: { label: 'Syncing reservations…', percent: 35 },
  inquiries: { label: 'Syncing inquiries…', percent: 55 },
  messages: { label: 'Syncing messages…', percent: 80 },
  moods: { label: 'Analyzing guest mood…', percent: 95 },
  done: { label: 'Sync complete', percent: 100 },
};

interface SyncProgressProps {
  job: SyncJob | null;
  counts: SyncCounts | null;
  syncing: boolean;
}

export function SyncProgress({ job, counts, syncing }: SyncProgressProps) {
  // Only show while running, or briefly on terminal states with a job present.
  if (!job || job.status === 'none') return null;
  if (!syncing && job.status !== 'completed' && job.status !== 'failed') return null;

  const isFailed = job.status === 'failed';
  const isDone = job.status === 'completed';
  const phase = (job.phase ?? 'starting') as SyncPhase;
  const meta = PHASE_META[phase] ?? PHASE_META.starting;
  const percent = isDone ? 100 : meta.percent;

  return (
    <Card className="mb-6 border-blue-200 dark:border-blue-900/50">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          {isFailed ? (
            <AlertCircle className="h-5 w-5 text-red-600" />
          ) : isDone ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
          )}
          <span className="font-medium text-gray-900 dark:text-neutral-100">
            {isFailed
              ? 'Sync failed'
              : isDone
                ? 'Conversations synced'
                : meta.label}
          </span>
        </div>

        {!isFailed && (
          <div
            className="h-2 w-full rounded-full bg-gray-100 dark:bg-neutral-800 overflow-hidden"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isDone ? 'bg-green-500' : 'bg-blue-600'
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>
        )}

        {isFailed ? (
          <p className="mt-2 text-sm text-red-600">
            {job.error || 'Something went wrong. Please try again.'}
          </p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-neutral-400">
            <span>Reservations: {job.reservationsSynced ?? counts?.reservations ?? 0}</span>
            <span>Inquiries: {job.inquiriesSynced ?? counts?.inquiries ?? 0}</span>
            <span>Messages: {job.messagesSynced ?? counts?.messages ?? 0}</span>
            {(job.moodsAnalyzed ?? 0) > 0 && <span>Moods: {job.moodsAnalyzed}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
