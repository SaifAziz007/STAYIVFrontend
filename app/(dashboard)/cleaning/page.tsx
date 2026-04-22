'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cleaningApi, Cleaning } from '@/lib/cleaning-api';
import { conversationsApi, ReservationConversation } from '@/lib/conversations-api';
import { Sparkles, Loader2, AlertCircle, Calendar, Users, CheckCircle, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { usePageHeader } from '@/components/layout/page-header-context';

export default function CleaningPage() {
    const { toast } = useToast();
    const [selectedDate, setSelectedDate] = useState<string>(
        new Date().toISOString().split('T')[0]
    );
    const [reservations, setReservations] = useState<ReservationConversation[]>([]);
    const [cleanings, setCleanings] = useState<Cleaning[]>([]);
    const [cleaningReservationIds, setCleaningReservationIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [markingDone, setMarkingDone] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');

    useEffect(() => {
        loadCleaningData();
    }, [selectedDate]);

    const loadCleaningData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Use the new endpoint to fetch reservations by checkout date
            const checkoutsOnDate = await conversationsApi.getReservationsByCheckout(selectedDate);
            setReservations(checkoutsOnDate);

            // Fetch cleaning records for this date
            const cleaningRecords = await cleaningApi.getCleanings(selectedDate);
            setCleanings(cleaningRecords);

            // Get IDs of reservations that have cleaning records
            const cleanedIds = await cleaningApi.getCleaningReservationIds(selectedDate);
            setCleaningReservationIds(cleanedIds);

        } catch (error: any) {
            console.error('Failed to load cleaning data:', error);
            setError('Failed to load cleaning data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getPropertyName = (reservation: ReservationConversation): string => {
        return reservation.propertyName || 'Unknown Property';
    };


    const handleMarkAsDone = async (reservation: ReservationConversation) => {
        try {
            setMarkingDone(reservation.id);

            const guestData = conversationsApi.parseGuestData(reservation.guestData);
            const guestsData = conversationsApi.parseGuestsData(reservation.guestsData);

            const checkoutDate = reservation.checkOut
                ? new Date(reservation.checkOut).toISOString().split('T')[0]
                : selectedDate;

            await cleaningApi.markCleaningDone({
                reservationId: reservation.id,
                reservationCode: reservation.code,
                guestName: guestData ? `${guestData.first_name} ${guestData.last_name || ''}`.trim() : 'Unknown Guest',
                propertyId: undefined,
                propertyName: reservation.propertyName, // Simplified - directly from reservation
                hospitablePropertyId: undefined,
                platform: reservation.platform,
                checkoutDate: checkoutDate,
                arrivalDate: reservation.checkIn,
                departureDate: reservation.checkOut,
                numberOfGuests: guestsData?.total || 1,
                notes: '',
                reservationData: JSON.parse(reservation.rawData),
            });

            toast({
                title: 'Success!',
                description: 'Cleaning marked as done.',
            });

            loadCleaningData();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: 'Failed to mark cleaning as done.',
                variant: 'destructive',
            });
        } finally {
            setMarkingDone(null);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getPlatformColor = (platform: string) => {
        switch (platform.toLowerCase()) {
            case 'airbnb':
                return 'bg-red-100 text-red-700 dark:bg-red-950/45 dark:text-red-300 border-0';
            case 'booking':
            case 'booking.com':
                return 'bg-blue-100 text-blue-700 dark:bg-blue-950/45 dark:text-blue-300 border-0';
            case 'vrbo':
                return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/45 dark:text-yellow-300 border-0';
            default:
                return 'bg-gray-100 text-gray-700 dark:bg-muted dark:text-muted-foreground border-0';
        }
    };

    // Separate pending and completed cleanings
    const pendingCleanings = reservations.filter(
        (res) => !cleaningReservationIds.includes(res.id)
    );
    const completedCleanings = reservations.filter(
        (res) => cleaningReservationIds.includes(res.id)
    );

    const cleaningHeaderActions = useMemo(() => {
        if (loading) return null;
        return (
            <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 dark:bg-blue-950/40 rounded-lg border border-blue-200 dark:border-blue-800/60">
                <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="text-2xl font-bold text-gray-900 dark:text-foreground">{reservations.length}</span>
                <span className="text-gray-600 dark:text-muted-foreground text-sm font-medium">Cleanings</span>
            </div>
        );
    }, [loading, reservations.length]);

    usePageHeader({
        title: 'Cleaning Schedule',
        description: 'Manage property cleanings based on checkout dates',
        actions: cleaningHeaderActions,
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400 mb-4" />
                <p className="text-gray-600 dark:text-muted-foreground">Loading cleaning schedule...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            {/* Date Picker */}
            <Card className="mb-6 border-gray-200 dark:border-border">
                <CardContent className="pt-6">
                    <div className="flex flex-wrap items-center gap-4">
                        <Calendar className="h-5 w-5 text-gray-600 dark:text-muted-foreground shrink-0" />
                        <label className="text-sm font-medium text-gray-700 dark:text-foreground">
                            Select Date:
                        </label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="border border-gray-300 dark:border-border rounded-lg px-4 py-2 text-sm bg-white dark:bg-card text-foreground focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                        />
                        <div className="ml-auto text-sm text-gray-600 dark:text-muted-foreground">
                            {pendingCleanings.length} pending • {completedCleanings.length} completed
                        </div>
                    </div>
                </CardContent>
            </Card>

            {error && (
                <Card className="mb-6 border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/25">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                            <div>
                                <p className="font-medium text-red-900 dark:text-red-200">Error</p>
                                <p className="text-sm text-red-700 dark:text-red-300/90">{error}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Tabs */}
            <div className="mb-6">
                <div className="border-b border-gray-200 dark:border-border">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        <button
                            type="button"
                            onClick={() => setActiveTab('pending')}
                            className={cn(
                                'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                                activeTab === 'pending'
                                    ? 'border-yellow-500 text-yellow-600 dark:text-yellow-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-muted-foreground dark:hover:text-foreground dark:hover:border-border'
                            )}
                        >
                            <span className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-yellow-500 rounded-full shrink-0" />
                                Pending
                                <span
                                    className={cn(
                                        'ml-2 py-0.5 px-2.5 rounded-full text-xs',
                                        activeTab === 'pending'
                                            ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-950/55 dark:text-yellow-300'
                                            : 'bg-gray-100 text-gray-600 dark:bg-muted dark:text-muted-foreground'
                                    )}
                                >
                                    {pendingCleanings.length}
                                </span>
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('completed')}
                            className={cn(
                                'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                                activeTab === 'completed'
                                    ? 'border-green-500 text-green-600 dark:text-green-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-muted-foreground dark:hover:text-foreground dark:hover:border-border'
                            )}
                        >
                            <span className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full shrink-0" />
                                Completed
                                <span
                                    className={cn(
                                        'ml-2 py-0.5 px-2.5 rounded-full text-xs',
                                        activeTab === 'completed'
                                            ? 'bg-green-100 text-green-600 dark:bg-green-950/50 dark:text-green-300'
                                            : 'bg-gray-100 text-gray-600 dark:bg-muted dark:text-muted-foreground'
                                    )}
                                >
                                    {completedCleanings.length}
                                </span>
                            </span>
                        </button>
                    </nav>
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'pending' ? (
                /* Pending Cleanings */
                <div>
                    {pendingCleanings.length === 0 ? (
                        <Card className="border-gray-200 dark:border-border">
                            <CardContent className="flex flex-col items-center justify-center py-20">
                                <div className="p-4 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-950/40 dark:to-emerald-950/40 rounded-2xl mb-6">
                                    <CheckCircle className="h-16 w-16 text-green-600 dark:text-green-400" />
                                </div>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-foreground mb-2">
                                    All cleanings completed! 🎉
                                </h2>
                                <p className="text-gray-600 dark:text-muted-foreground">No pending cleanings for this date</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {pendingCleanings.map((reservation) => {
                                const guestData = conversationsApi.parseGuestData(reservation.guestData);
                                const guestsData = conversationsApi.parseGuestsData(reservation.guestsData);

                                return (
                                    <Card key={reservation.id} className="hover:shadow-md transition-shadow border-gray-200 dark:border-border">
                                        <CardHeader>
                                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                        <Badge className={getPlatformColor(reservation.platform)}>
                                                            {reservation.platform.toUpperCase()}
                                                        </Badge>
                                                        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-950/45 dark:text-yellow-300 border-0">
                                                            PENDING
                                                        </Badge>
                                                        {reservation.code && (
                                                            <span className="text-sm text-gray-600 dark:text-muted-foreground font-mono">
                                                                {reservation.code}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <CardTitle className="text-xl mb-1 text-card-foreground">
                                                        {guestData ? `${guestData.first_name} ${guestData.last_name || ''}`.trim() : 'Unknown Guest'}
                                                    </CardTitle>
                                                    
                                                    {/* Property Name */}
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Home className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                                                        <span className="text-base font-medium text-blue-900 dark:text-blue-300">{getPropertyName(reservation)}</span>
                                                    </div>

                                                    <CardDescription className="mt-2 text-muted-foreground">
                                                        <div className="flex items-center gap-4 flex-wrap">
                                                            <div className="flex items-center gap-1">
                                                                <Calendar className="h-4 w-4 shrink-0" />
                                                                <span>Checkout: {formatDate(reservation.checkOut!)} at {formatTime(reservation.checkOut!)}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Users className="h-4 w-4 shrink-0" />
                                                                <span>{guestsData?.total || 1} guests</span>
                                                            </div>
                                                        </div>
                                                    </CardDescription>
                                                </div>
                                                <Button
                                                    onClick={() => handleMarkAsDone(reservation)}
                                                    disabled={markingDone === reservation.id}
                                                    className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-500 shrink-0"
                                                >
                                                    {markingDone === reservation.id ? (
                                                        <>
                                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                            Marking...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CheckCircle className="h-4 w-4 mr-2" />
                                                            Mark as Done
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </CardHeader>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            ) : (
                /* Completed Cleanings */
                <div>
                    {completedCleanings.length === 0 ? (
                        <Card className="border-gray-200 dark:border-border">
                            <CardContent className="flex flex-col items-center justify-center py-20">
                                <div className="p-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-muted dark:to-muted/80 rounded-2xl mb-6">
                                    <Sparkles className="h-16 w-16 text-gray-500 dark:text-muted-foreground" />
                                </div>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-foreground mb-2">
                                    No completed cleanings yet
                                </h2>
                                <p className="text-gray-600 dark:text-muted-foreground">
                                    Cleanings marked as done will appear here
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {completedCleanings.map((reservation) => {
                                const guestData = conversationsApi.parseGuestData(reservation.guestData);
                                const guestsData = conversationsApi.parseGuestsData(reservation.guestsData);
                                const cleaningRecord = cleanings.find(c => c.reservationId === reservation.id);

                                return (
                                    <Card key={reservation.id} className="border-green-200 dark:border-green-900/50 bg-green-50/50 dark:bg-green-950/20">
                                        <CardHeader>
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                        <Badge className={getPlatformColor(reservation.platform)}>
                                                            {reservation.platform.toUpperCase()}
                                                        </Badge>
                                                        <Badge className="bg-green-100 text-green-800 dark:bg-green-950/45 dark:text-green-300 border-0">
                                                            COMPLETED
                                                        </Badge>
                                                        {reservation.code && (
                                                            <span className="text-sm text-gray-600 dark:text-muted-foreground font-mono">
                                                                {reservation.code}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <CardTitle className="text-xl mb-1 text-card-foreground">
                                                        {guestData ? `${guestData.first_name} ${guestData.last_name || ''}`.trim() : 'Unknown Guest'}
                                                    </CardTitle>
                                                    
                                                    {/* Property Name */}
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Home className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                                                        <span className="text-base font-medium text-blue-900 dark:text-blue-300">{getPropertyName(reservation)}</span>
                                                    </div>

                                                    <CardDescription className="mt-2 text-muted-foreground">
                                                        <div className="flex items-center gap-4 flex-wrap">
                                                            <div className="flex items-center gap-1">
                                                                <Calendar className="h-4 w-4 shrink-0" />
                                                                <span>Checkout: {formatDate(reservation.checkOut!)}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Users className="h-4 w-4 shrink-0" />
                                                                <span>{guestsData?.total || 1} guests</span>
                                                            </div>
                                                            {cleaningRecord && (
                                                                <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                                                                    ✓ Marked done {formatDate(cleaningRecord.markedDoneAt)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </CardDescription>
                                                </div>
                                                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400 shrink-0" />
                                            </div>
                                        </CardHeader>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}