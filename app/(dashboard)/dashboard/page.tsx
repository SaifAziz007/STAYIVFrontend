'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Flag,
  ShieldAlert,
  PackageSearch,
  CircleAlert,
  CreditCard,
  ClipboardList,
  CalendarDays,
  Inbox,
} from 'lucide-react';
import { authApi, canViewScreen, type User } from '@/lib/auth';
import type { AppScreenKey } from '@/lib/route-permissions';
import { cn } from '@/lib/utils';

type ModuleTile = {
  title: string;
  description: string;
  href: string;
  screen: AppScreenKey;
  icon: typeof Sparkles;
  iconBg: string;
  iconColor: string;
  cardBorder: string;
};

const MODULES: ModuleTile[] = [
  {
    title: 'Reservations',
    description: 'Guest bookings, dates, and channels',
    href: '/reservations',
    screen: 'RESERVATIONS',
    icon: CalendarDays,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    cardBorder: 'border-amber-100/90',
  },
  {
    title: 'Inquiries',
    description: 'Pre-booking questions and date requests',
    href: '/inquiries',
    screen: 'INQUIRIES',
    icon: Inbox,
    iconBg: 'bg-slate-50',
    iconColor: 'text-slate-600',
    cardBorder: 'border-slate-100/90',
  },
  {
    title: 'Cleaning',
    description: 'Schedule and track cleaning tasks',
    href: '/cleaning',
    screen: 'CLEANING',
    icon: Sparkles,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    cardBorder: 'border-emerald-100/90',
  },
  {
    title: 'Claimed Chats',
    description: 'Conversations claimed by your team',
    href: '/claimed-chats',
    screen: 'CLAIMED_CHATS',
    icon: Flag,
    iconBg: 'bg-sky-50',
    iconColor: 'text-sky-600',
    cardBorder: 'border-sky-100/90',
  },
  {
    title: 'Review / Removal',
    description: 'Pending reviews and removals',
    href: '/review-removal',
    screen: 'REVIEW_REMOVAL',
    icon: ShieldAlert,
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-600',
    cardBorder: 'border-orange-100/90',
  },
  {
    title: 'Lost & Found',
    description: 'Track items reported by guests',
    href: '/lost-found',
    screen: 'LOST_FOUND',
    icon: PackageSearch,
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    cardBorder: 'border-violet-100/90',
  },
  {
    title: 'Open Issues',
    description: 'Active maintenance and guest issues',
    href: '/issues',
    screen: 'ISSUES',
    icon: CircleAlert,
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-600',
    cardBorder: 'border-rose-100/90',
  },
  {
    title: 'Pending Payments',
    description: 'Outstanding invoices and payouts',
    href: '/pending-payments',
    screen: 'PENDING_PAYMENTS',
    icon: CreditCard,
    iconBg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    cardBorder: 'border-indigo-100/90',
  },
  {
    title: 'Form Collection',
    description: 'Guest forms and submissions',
    href: '/form-collection',
    screen: 'FORM_COLLECTION',
    icon: ClipboardList,
    iconBg: 'bg-cyan-50',
    iconColor: 'text-cyan-600',
    cardBorder: 'border-cyan-100/90',
  },
];

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setUser(authApi.getUser());
  }, []);

  const visibleCount = MODULES.filter(
    (m) => !mounted || !user || canViewScreen(user, m.screen),
  ).length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10 pb-12">
      <div className="text-center pt-6 sm:pt-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/90 bg-white px-4 py-1.5 text-medium font-medium text-slate-600 shadow-sm mb-6">
          <span aria-hidden>✨</span>
          Manage More. Stress Less.
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mb-3">
          Welcome back
          {user?.name ? (
            <>
              {', '}
              <span className="text-blue-600">{user.name}</span>
            </>
          ) : null}
        </h1>
     
      </div>

      <section aria-labelledby="dashboard-modules-heading">
       
        <div
          className={cn(
            'grid gap-4 sm:gap-5',
            'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4',
          )}
        >
          {MODULES.map((mod) => {
            const allowed = !mounted || !user || canViewScreen(user, mod.screen);

            const inner = (
              <>
                <div
                  className={cn(
                    'mb-4 flex h-14 w-14 items-center justify-center rounded-2xl',
                    mod.iconBg,
                  )}
                >
                  <mod.icon className={cn('h-7 w-7', mod.iconColor)} strokeWidth={1.75} />
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-1.5">{mod.title}</h3>
                <p className="text-sm text-slate-500 leading-snug line-clamp-2">{mod.description}</p>
              </>
            );

            if (!allowed) {
              return (
                <div
                  key={mod.href}
                  className={cn(
                    'relative flex flex-col rounded-2xl border bg-slate-50 p-6 opacity-60 cursor-not-allowed',
                    mod.cardBorder,
                  )}
                  title="You don’t have access to this module"
                >
                  {inner}
                </div>
              );
            }

            return (
              <Link
                key={mod.href}
                href={mod.href}
                className={cn(
                  'group relative flex flex-col rounded-2xl border bg-white p-6',
                  'shadow-sm shadow-slate-200/80',
                  'transition-all duration-200 ease-out',
                  'hover:shadow-lg hover:shadow-slate-300/50 hover:-translate-y-0.5',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500',
                  'active:scale-[0.99]',
                  mod.cardBorder,
                )}
              >
                {inner}
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
