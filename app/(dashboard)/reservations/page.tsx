'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, CalendarDays, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import {
  reservationsApi,
  type ReservationRow,
  type ReservationsListParams,
} from '@/lib/reservations-api';
import { useToast } from '@/hooks/use-toast';
import { usePageHeader } from '@/components/layout/page-header-context';

export default function ReservationsPage() {
  const { toast } = useToast();
  const [rows, setRows] = useState<ReservationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] =
    useState<NonNullable<ReservationsListParams['sortBy']>>('arrivalDate');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [checkInFrom, setCheckInFrom] = useState('');
  const [checkInTo, setCheckInTo] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await reservationsApi.list({
        page,
        limit,
        search: search || undefined,
        sortBy,
        order,
        checkInFrom: checkInFrom || undefined,
        checkInTo: checkInTo || undefined,
      });
      setRows(res.data);
      setTotalPages(res.totalPages);
      setTotal(res.total);
    } catch (e) {
      console.error(e);
      toast({
        title: 'Error',
        description: 'Failed to load reservations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
    // toast must NOT be in deps — useToast() returns a new reference each render and causes an infinite fetch loop.
  }, [page, limit, search, sortBy, order, checkInFrom, checkInTo]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const toggleSort = (field: NonNullable<ReservationsListParams['sortBy']>) => {
    setPage(1);
    if (sortBy === field) {
      setOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setOrder('desc');
    }
  };

  usePageHeader({
    title: 'Reservations',
    description: 'Bookings synced from your channels — search, filter by stay dates, and sort',
  });

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <Card className="border-gray-200 mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>Search guests and properties; optional check-in date range</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Guest, property, code, or channel…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="submit" variant="secondary">
              Search
            </Button>
          </form>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 dark:text-neutral-400">Check-in from</label>
              <Input
                type="date"
                value={checkInFrom}
                onChange={(e) => {
                  setPage(1);
                  setCheckInFrom(e.target.value);
                }}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 dark:text-neutral-400">Check-in to</label>
              <Input
                type="date"
                value={checkInTo}
                onChange={(e) => {
                  setPage(1);
                  setCheckInTo(e.target.value);
                }}
              />
            </div>
            {(checkInFrom || checkInTo) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPage(1);
                  setCheckInFrom('');
                  setCheckInTo('');
                }}
              >
                Clear dates
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center min-h-[320px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading reservations…</p>
          </div>
        </div>
      ) : rows.length === 0 ? (
        <Card className="border-gray-200">
          <CardContent className="p-16 text-center">
            <div className="p-4 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl inline-flex mb-6">
              <CalendarDays className="h-12 w-12 text-amber-700" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground mb-2">No reservations</h3>
            <p className="text-gray-600 dark:text-neutral-400 max-w-md mx-auto">
              {search || checkInFrom || checkInTo
                ? 'Try adjusting search or date filters.'
                : 'Synced reservations from Hospitable will appear here.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-border bg-gray-50/80 dark:bg-card">
                    <th className="text-left p-3 font-semibold text-gray-700 dark:text-neutral-300">Guest</th>
                    <th className="text-left p-3 font-semibold text-gray-700 dark:text-neutral-300">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 hover:text-blue-700 dark:hover:text-blue-400"
                        onClick={() => toggleSort('propertyName')}
                      >
                        Property
                        {sortBy === 'propertyName' && (
                          <Badge variant="secondary" className="text-[10px]">
                            {order === 'asc' ? '↑' : '↓'}
                          </Badge>
                        )}
                      </button>
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-700 min-w-[12rem]">
                      Guests
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-700 dark:text-neutral-300">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 hover:text-blue-700 dark:hover:text-blue-400"
                        onClick={() => toggleSort('arrivalDate')}
                      >
                        Check-in
                        {sortBy === 'arrivalDate' && (
                          <Badge variant="secondary" className="text-[10px]">
                            {order === 'asc' ? '↑' : '↓'}
                          </Badge>
                        )}
                      </button>
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-700 dark:text-neutral-300">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 hover:text-blue-700 dark:hover:text-blue-400"
                        onClick={() => toggleSort('departureDate')}
                      >
                        Check-out
                        {sortBy === 'departureDate' && (
                          <Badge variant="secondary" className="text-[10px]">
                            {order === 'asc' ? '↑' : '↓'}
                          </Badge>
                        )}
                      </button>
                    </th>
                    <th className="text-right p-3 font-semibold text-gray-700 dark:text-neutral-300 whitespace-nowrap">
                      Nights
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-700 dark:text-neutral-300">Mood</th>
                    <th className="text-left p-3 font-semibold text-gray-700 dark:text-neutral-300">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 hover:text-blue-700 dark:hover:text-blue-400"
                        onClick={() => toggleSort('platform')}
                      >
                        Platform
                        {sortBy === 'platform' && (
                          <Badge variant="secondary" className="text-[10px]">
                            {order === 'asc' ? '↑' : '↓'}
                          </Badge>
                        )}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-gray-100 dark:border-border/60 hover:bg-gray-50/60 dark:hover:bg-muted/40 transition-colors"
                    >
                      <td className="p-3 font-medium text-gray-900 dark:text-foreground">{r.guestName}</td>
                      <td className="p-3 text-gray-700 dark:text-neutral-300">{r.propertyName ?? '—'}</td>
                      <td className="p-3 text-left text-gray-700 dark:text-neutral-300 text-xs leading-snug max-w-[16rem]">
                        {r.guestsSummary}
                      </td>
                      <td className="p-3 text-gray-700 dark:text-neutral-300 whitespace-nowrap">
                        {reservationsApi.formatDate(r.checkIn)}
                      </td>
                      <td className="p-3 text-gray-700 dark:text-neutral-300 whitespace-nowrap">
                        {reservationsApi.formatDate(r.checkOut)}
                      </td>
                      <td className="p-3 text-right tabular-nums text-gray-700 dark:text-neutral-300">
                        {r.nights != null ? r.nights : '—'}
                      </td>
                      <td className="p-3 text-gray-700 dark:text-neutral-300 capitalize">
                        {r.mood?.trim() ? r.mood : '—'}
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="font-normal capitalize">
                          {r.platform}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
            <p className="text-sm text-gray-600 dark:text-neutral-400">
              Showing {rows.length} of {total} reservation{total === 1 ? '' : 's'}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-gray-600 tabular-nums">
                Page {page} of {Math.max(1, totalPages)}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

        </>
      )}
    </div>
  );
}
