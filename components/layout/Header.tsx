'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { authApi, User } from '@/lib/auth';
import { LogOut, User as UserIcon } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { usePageHeaderContext } from '@/components/layout/page-header-context';

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);
  const pageHeader = usePageHeaderContext();

  useEffect(() => {
    setMounted(true);
    setUser(authApi.getUser());
  }, []);

  const handleLogout = () => {
    authApi.logout();
    router.push('/login');
  };

  // Don't render user info until mounted to avoid hydration mismatch
  const centerHeader = pageHeader?.config ? (
    <div className="flex-1 min-w-0 flex items-center justify-between gap-4 mx-4">
      <div className="min-w-0">
        <h1 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-foreground leading-tight truncate">
          {pageHeader.config.title}
        </h1>
        {pageHeader.config.description ? (
          <p className="text-xs sm:text-sm text-gray-600 dark:text-muted-foreground mt-0.5 line-clamp-2">
            {pageHeader.config.description}
          </p>
        ) : null}
      </div>
      {pageHeader.config.actions ? (
        <div className="shrink-0 flex items-center gap-2 flex-wrap justify-end">{pageHeader.config.actions}</div>
      ) : null}
    </div>
  ) : (
    <div className="flex-1 min-w-0" aria-hidden />
  );

  if (!mounted) {
    return (
      <header className="border-b border-gray-200 dark:border-border bg-white/80 dark:bg-card/90 backdrop-blur-sm fixed top-0 left-0 right-0 z-50 shadow-sm transition-colors duration-200">
        <div className="pl-6 pr-6 min-h-16 py-2 flex items-center gap-2">
          <Link href="/dashboard" className="shrink-0 text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            StayIV
          </Link>
          {centerHeader}
          <div className="shrink-0 flex items-center gap-3">
            <ThemeToggle />
            <span className="text-sm text-gray-600 dark:text-muted-foreground">Loading...</span>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b border-gray-200 dark:border-border bg-white/80 dark:bg-card/90 backdrop-blur-sm fixed top-0 left-0 right-0 z-50 shadow-sm transition-colors duration-200">
      <div className="pl-6 pr-6 min-h-16 py-2 flex items-center gap-2">
        <Link href="/dashboard" className="shrink-0 text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-indigo-700 transition-all">
          StayIV
        </Link>

        {centerHeader}

        <div className="shrink-0 flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-muted border border-gray-200 dark:border-border">
            <UserIcon className="h-4 w-4 text-gray-600 dark:text-muted-foreground" />
            <span className="text-sm font-medium text-gray-700 dark:text-foreground max-w-[120px] truncate">{user?.name}</span>
          </div>
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}

