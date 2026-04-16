'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  MessageSquare,
  Settings,
  LayoutDashboard,
  Star,
  MessageCircle,
  Flag,
  AlertTriangle,
  Package,
  Sparkles,
  FileText,
  DollarSign,
  Upload,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { authApi, canViewScreen, type User } from '@/lib/auth';
import type { AppScreenKey } from '@/lib/route-permissions';

type MenuItem = {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
  screen: AppScreenKey;
  adminOnly?: boolean;
};

const menuItems: MenuItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, screen: 'DASHBOARD' },
  { name: 'Properties', href: '/properties', icon: Building2, screen: 'PROPERTIES' },
  { name: 'Reviews', href: '/reviews', icon: Star, screen: 'REVIEWS' },
  { name: 'Chats', href: '/chats/all', icon: MessageCircle, screen: 'CONVERSATIONS' },
  { name: 'Cleaning', href: '/cleaning', icon: Sparkles, screen: 'CLEANING' },
  { name: 'Claimed Chats', href: '/claimed-chats', icon: Flag, screen: 'CLAIMED_CHATS' },
  { name: 'Review/Removal', href: '/review-removal', icon: AlertTriangle, screen: 'REVIEW_REMOVAL' },
  { name: 'Lost & Found', href: '/lost-found', icon: Package, screen: 'LOST_FOUND' },
  { name: 'Open Issues', href: '/issues', icon: FileText, screen: 'ISSUES' },
  { name: 'Pending Payments', href: '/pending-payments', icon: DollarSign, screen: 'PENDING_PAYMENTS' },
  { name: 'Form Collection', href: '/form-collection', icon: Upload, screen: 'FORM_COLLECTION' },
  { name: 'AI Chat', href: '/ai-chat', icon: MessageSquare, screen: 'AI_KNOWLEDGE_BASE' },
  { name: 'Settings', href: '/settings', icon: Settings, screen: 'HOSPITABLE_INTEGRATION' },
  { name: 'Team', href: '/settings/team', icon: Users, screen: 'USER_MANAGEMENT', adminOnly: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setMounted(true);
    setUser(authApi.getUser());
  }, []);

  const visible = useMemo(() => {
    if (!mounted || !user) {
      return [];
    }
    return menuItems.filter((item) => {
      if (item.adminOnly && user.role !== 'ADMIN') {
        return false;
      }
      return canViewScreen(user, item.screen);
    });
  }, [mounted, user]);

  // Same structure for SSR + first client paint: no localStorage until mounted
  if (!mounted) {
    return (
      <aside className="w-64 bg-white/95 backdrop-blur-sm border-r border-gray-200 min-h-screen fixed left-0 top-16 shadow-sm">
        <nav className="p-3 space-y-1" aria-busy="true" aria-label="Loading navigation">
          {menuItems.map((item) => (
            <div
              key={item.href}
              className="h-10 rounded-lg bg-gray-100/90 animate-pulse"
            />
          ))}
        </nav>
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-white/95 backdrop-blur-sm border-r border-gray-200 min-h-screen fixed left-0 top-16 shadow-sm">
      <nav className="p-3 space-y-1">
        {visible.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative',
                isActive
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm border border-blue-100'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900',
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5 transition-colors',
                  isActive ? 'text-blue-600' : 'text-gray-500',
                )}
              />
              <span className={cn('transition-colors', isActive && 'font-semibold')}>
                {item.name}
              </span>
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-full" />
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
