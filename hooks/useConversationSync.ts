'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  conversationsApi,
  type SyncJob,
  type SyncCounts,
} from '@/lib/conversations-api';

const POLL_INTERVAL_MS = 2500;

interface UseConversationSyncOptions {
  /** Called once when a running sync transitions to "completed". */
  onComplete?: () => void;
  /** Poll on mount so an in-progress sync (e.g. after a page refresh) is picked up. */
  watchOnMount?: boolean;
}

interface UseConversationSyncResult {
  syncing: boolean;
  job: SyncJob | null;
  counts: SyncCounts | null;
  error: string | null;
  /** Trigger a new background sync and start polling. */
  start: () => Promise<void>;
}

/**
 * Starts a background conversation sync and polls its status so the UI can show
 * live progress (phase + counts) instead of a request that blocks or times out.
 */
export function useConversationSync(
  options: UseConversationSyncOptions = {},
): UseConversationSyncResult {
  const { onComplete, watchOnMount = true } = options;

  const [syncing, setSyncing] = useState(false);
  const [job, setJob] = useState<SyncJob | null>(null);
  const [counts, setCounts] = useState<SyncCounts | null>(null);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const mountedRef = useRef(true);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const poll = useCallback(async () => {
    try {
      const res = await conversationsApi.getSyncStatus();
      if (!mountedRef.current) return;

      const nextJob = res.data.job;
      setJob(nextJob);
      setCounts(res.data.counts);

      if (nextJob.status === 'completed') {
        setSyncing(false);
        stopPolling();
        onCompleteRef.current?.();
      } else if (nextJob.status === 'failed') {
        setSyncing(false);
        setError(nextJob.error || 'Sync failed. Please try again.');
        stopPolling();
      } else if (nextJob.status === 'running' || nextJob.status === 'queued') {
        setSyncing(true);
      }
    } catch (err) {
      // Transient polling errors shouldn't kill the whole flow; keep polling.
      console.error('Failed to poll sync status:', err);
    }
  }, [stopPolling]);

  const startPolling = useCallback(() => {
    stopPolling();
    void poll(); // immediate first read
    intervalRef.current = setInterval(() => void poll(), POLL_INTERVAL_MS);
  }, [poll, stopPolling]);

  const start = useCallback(async () => {
    try {
      setError(null);
      setSyncing(true);
      await conversationsApi.syncConversations();
      startPolling();
    } catch (err: any) {
      setSyncing(false);
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to start sync. Please try again.';
      setError(message);
    }
  }, [startPolling]);

  // On mount, check whether a sync is already running (survives refresh/navigation).
  useEffect(() => {
    mountedRef.current = true;
    if (!watchOnMount) return () => undefined;

    (async () => {
      try {
        const res = await conversationsApi.getSyncStatus();
        if (!mountedRef.current) return;
        setJob(res.data.job);
        setCounts(res.data.counts);
        if (res.data.job.status === 'running' || res.data.job.status === 'queued') {
          setSyncing(true);
          startPolling();
        }
      } catch {
        // ignore — nothing to watch yet
      }
    })();

    return () => {
      mountedRef.current = false;
      stopPolling();
    };
  }, [watchOnMount, startPolling, stopPolling]);

  return { syncing, job, counts, error, start };
}
