'use client';

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type PageHeaderConfig = {
  title: string;
  description?: string;
  actions?: ReactNode;
};

type Ctx = {
  config: PageHeaderConfig | null;
  setConfig: (c: PageHeaderConfig | null) => void;
};

const PageHeaderContext = createContext<Ctx | null>(null);

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [config, setConfigState] = useState<PageHeaderConfig | null>(null);

  const setConfig = useCallback((next: PageHeaderConfig | null) => {
    setConfigState((prev) => {
      if (next === null) {
        return prev === null ? prev : null;
      }
      if (
        prev &&
        prev.title === next.title &&
        prev.description === next.description &&
        prev.actions === next.actions
      ) {
        return prev;
      }
      return next;
    });
  }, []);

  const value = useMemo(() => ({ config, setConfig }), [config, setConfig]);

  return (
    <PageHeaderContext.Provider value={value}>{children}</PageHeaderContext.Provider>
  );
}

/**
 * Register the current page title, optional subtitle, and optional header actions.
 * Memoize `actions` (e.g. with useMemo) when it contains elements that would be a new reference every render.
 */
export function usePageHeader(config: PageHeaderConfig) {
  const setConfig = useContext(PageHeaderContext)?.setConfig;

  useLayoutEffect(() => {
    if (!setConfig) return;
    setConfig(config);
    return () => setConfig(null);
  }, [setConfig, config.title, config.description, config.actions]);
}

export function usePageHeaderContext() {
  return useContext(PageHeaderContext);
}
