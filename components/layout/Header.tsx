'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { authApi, User } from '@/lib/auth';

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setUser(authApi.getUser());
  }, []);

  const handleLogout = () => {
    authApi.logout();
    router.push('/login');
  };

  // Don't render user info until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <header className="border-b bg-white fixed top-0 left-0 right-0 z-50">
        <div className="px-4 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="text-2xl font-bold text-blue-600">
            StayIV
          </Link>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Loading...</span>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b bg-white fixed top-0 left-0 right-0 z-50">
      <div className="px-4 h-16 flex items-center justify-between">
        <Link href="/dashboard" className="text-2xl font-bold text-blue-600">
          StayIV
        </Link>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user?.name}</span>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}

