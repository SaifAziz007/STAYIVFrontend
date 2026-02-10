'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { authApi, User } from '@/lib/auth';
import { LogOut, User as UserIcon } from 'lucide-react';

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
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm fixed top-0 left-0 right-0 z-50 shadow-sm">
        <div className="px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
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
    <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm fixed top-0 left-0 right-0 z-50 shadow-sm">
      <div className="px-6 h-16 flex items-center justify-between">
        <Link href="/dashboard" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-indigo-700 transition-all">
          StayIV
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200">
            <UserIcon className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">{user?.name}</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}

