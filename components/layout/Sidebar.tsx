'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Building2, MessageSquare, Settings, LayoutDashboard, Star, MessageCircle, Flag, AlertTriangle, Package, Sparkles, FileText, DollarSign, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Properties',
    href: '/properties',
    icon: Building2,
  },
  {
    name: 'Reviews',
    href: '/reviews',
    icon: Star,
  },
  {
    name: 'Chats',
    href: '/chats/all',
    icon: MessageCircle,
  },
  {
    name: 'Cleaning',
    href: '/cleaning',
    icon: Sparkles,
  },
  {
    name: 'Claimed Chats',
    href: '/claimed-chats',
    icon: Flag,
  },
  {
    name: 'Review/Removal',
    href: '/review-removal',
    icon: AlertTriangle,
  },
  {
    name: 'Lost & Found',
    href: '/lost-found',
    icon: Package,
  },
  {
    name: 'Open Issues',
    href: '/issues',
    icon: FileText,
  },
  {
    name: 'Pending Payments',
    href: '/pending-payments',
    icon: DollarSign,
  },
  {
    name: 'Form Collection',
    href: '/form-collection',
    icon: Upload,
  },
  {
    name: 'AI Chat',
    href: '/ai-chat',
    icon: MessageSquare,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];
export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen fixed left-0 top-16">
      <nav className="p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

