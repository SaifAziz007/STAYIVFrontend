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
  CalendarDays,
  Inbox,
  MessagesSquare,
  Bot,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { authApi, canViewScreen, type User } from '@/lib/auth';
import type { AppScreenKey } from '@/lib/route-permissions';

type MenuItem = {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
  // Items without a screen are always visible to any authenticated team member
  // (e.g. Team Chat — an internal communication tool everyone should have).
  screen?: AppScreenKey;
  adminOnly?: boolean;
};

const menuItems: MenuItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, screen: 'DASHBOARD' },
  { name: 'Properties', href: '/properties', icon: Building2, screen: 'PROPERTIES' },
  { name: 'Reviews', href: '/reviews', icon: Star, screen: 'REVIEWS' },
  { name: 'Reservations', href: '/reservations', icon: CalendarDays, screen: 'RESERVATIONS' },
  { name: 'Inquiries', href: '/inquiries', icon: Inbox, screen: 'INQUIRIES' },
  { name: 'Chats', href: '/chats/all', icon: MessageCircle, screen: 'CONVERSATIONS' },
  { name: 'Team Chat', href: '/team-chat', icon: MessagesSquare },
  { name: 'Ask AI', href: '/ai-assistant', icon: Bot },
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

type SidebarProps = {
  collapsed?: boolean;
  onToggle?: () => void;
};

export default function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
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
      if (!item.screen) {
        return true;
      }
      return canViewScreen(user, item.screen);
    });
  }, [mounted, user]);

  const asideWidth = collapsed ? 'w-16' : 'w-64';

  // Same structure for SSR + first client paint: no localStorage until mounted
  if (!mounted) {
    return (
      <aside className={cn(
        'bg-white/95 dark:bg-card/95 backdrop-blur-sm border-r border-gray-200 dark:border-border h-[calc(100vh-4rem)] overflow-y-auto fixed left-0 top-16 shadow-sm transition-[width,background-color] duration-200',
        asideWidth,
      )}>
        <nav className="p-3 space-y-1" aria-busy="true" aria-label="Loading navigation">
          {menuItems.map((item) => (
            <div
              key={item.href}
              className="h-10 rounded-lg bg-gray-100/90 dark:bg-muted/60 animate-pulse"
            />
          ))}
        </nav>
      </aside>
    );
  }

  return (
    <aside className={cn(
      'bg-white/95 dark:bg-card/95 backdrop-blur-sm border-r border-gray-200 dark:border-border h-[calc(100vh-4rem)] overflow-y-auto overflow-x-hidden fixed left-0 top-16 shadow-sm transition-[width,background-color] duration-200',
      asideWidth,
    )}>
      {/* Collapse / expand toggle */}
      <div className={cn('flex px-3 pt-3', collapsed ? 'justify-center' : 'justify-end')}>
        <button
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="p-2 rounded-lg text-gray-500 dark:text-muted-foreground hover:bg-gray-100 dark:hover:bg-muted/60 hover:text-gray-900 dark:hover:text-foreground transition-colors"
        >
          {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </button>
      </div>

      <nav className="p-3 pt-2 space-y-1">
        {visible.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.name : undefined}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative',
                collapsed && 'justify-center px-0',
                isActive
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 text-blue-700 dark:text-blue-400 shadow-sm border border-blue-100 dark:border-blue-800/80'
                  : 'text-gray-700 dark:text-muted-foreground hover:bg-gray-50 dark:hover:bg-muted/50 hover:text-gray-900 dark:hover:text-foreground',
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5 shrink-0 transition-colors',
                  isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-muted-foreground',
                )}
              />
              {!collapsed && (
                <span className={cn('transition-colors truncate', isActive && 'font-semibold')}>
                  {item.name}
                </span>
              )}
              {isActive && !collapsed && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 dark:bg-blue-500 rounded-r-full" />
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
