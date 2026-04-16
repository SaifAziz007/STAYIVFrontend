'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { authApi, canViewScreen } from '@/lib/auth';
import { getRequiredScreenForPath } from '@/lib/route-permissions';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { Toaster } from 'sonner';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!authApi.isAuthenticated()) {
      router.push('/login');
      return;
    }
    const user = authApi.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    const screen = getRequiredScreenForPath(pathname);
    if (screen && !canViewScreen(user, screen)) {
      router.replace('/dashboard');
    }
  }, [pathname, router]);

  useEffect(() => {
    if (!authApi.isAuthenticated()) {
      return;
    }
    const user = authApi.getUser();
    if (!user) return;
    if (user.permissions && Object.keys(user.permissions).length > 0) {
      return;
    }
    authApi
      .me()
      .then(({ user: fresh }) => {
        authApi.updateStoredUser(fresh);
      })
      .catch(() => {
        /* ignore */
      });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Header />
      <Sidebar />
      <main className="ml-64 mt-16 p-8">{children}</main>
      <Toaster position="top-right" richColors />
    </div>
  );
}
