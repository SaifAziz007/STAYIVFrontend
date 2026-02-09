'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cleaningApi, Cleaning } from '@/lib/cleaning-api';
import { conversationsApi, ReservationConversation } from '@/lib/conversations-api';
import { Sparkles, Loader2, AlertCircle, Calendar, Users, CheckCircle, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
                return 'bg-red-100 text-red-700';
            case 'booking':
            case 'booking.com':
                return 'bg-blue-100 text-blue-700';
            case 'vrbo':
                return 'bg-yellow-100 text-yellow-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    // Separate pending and completed cleanings
    const pendingCleanings = reservations.filter(
        (res) => !cleaningReservationIds.includes(res.id)
    );
    const completedCleanings = reservations.filter(
        (res) => cleaningReservationIds.includes(res.id)
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-600">Loading cleaning schedule...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Cleaning Schedule</h1>
                    <p className="text-gray-600 mt-1">
                        Manage property cleanings based on checkout dates
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    <span className="text-2xl font-bold text-gray-900">{reservations.length}</span>
                    <span className="text-gray-600">Cleanings</span>
                </div>
            </div>

            {/* Date Picker */}
            <Card className="mb-6">
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        <Calendar className="h-5 w-5 text-gray-600" />
                        <label className="text-sm font-medium text-gray-700">
                            Select Date:
                        </label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <div className="ml-auto text-sm text-gray-600">
                            {pendingCleanings.length} pending • {completedCleanings.length} completed
                        </div>
                    </div>
                </CardContent>
            </Card>

            {error && (
                <Card className="mb-6 border-red-200 bg-red-50">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                            <div>
                                <p className="font-medium text-red-900">Error</p>
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Tabs */}
            <div className="mb-6">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === 'pending'
                                    ? 'border-yellow-500 text-yellow-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }
              `}
                        >
                            <span className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                                Pending
                                <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs ${activeTab === 'pending' ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                    {pendingCleanings.length}
                                </span>
                            </span>
                        </button>

                        <button
                            onClick={() => setActiveTab('completed')}
                            className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === 'completed'
                                    ? 'border-green-500 text-green-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }
              `}
                        >
                            <span className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                Completed
                                <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs ${activeTab === 'completed' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                                    }`}>
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
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-16">
                                <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                                    All cleanings completed! 🎉
                                </h2>
                                <p className="text-gray-600">No pending cleanings for this date</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {pendingCleanings.map((reservation) => {
                                const guestData = conversationsApi.parseGuestData(reservation.guestData);
                                const guestsData = conversationsApi.parseGuestsData(reservation.guestsData);

                                return (
                                    <Card key={reservation.id} className="hover:shadow-md transition-shadow">
                                        <CardHeader>
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <Badge className={getPlatformColor(reservation.platform)}>
                                                            {reservation.platform.toUpperCase()}
                                                        </Badge>
                                                        <Badge className="bg-yellow-100 text-yellow-800">
                                                            PENDING
                                                        </Badge>
                                                        {reservation.code && (
                                                            <span className="text-sm text-gray-600 font-mono">
                                                                {reservation.code}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <CardTitle className="text-xl mb-1">
                                                        {guestData ? `${guestData.first_name} ${guestData.last_name || ''}`.trim() : 'Unknown Guest'}
                                                    </CardTitle>
                                                    
                                                    {/* Property Name */}
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Home className="h-4 w-4 text-blue-600" />
                                                        <span className="text-base font-medium text-blue-900">{getPropertyName(reservation)}</span>
                                                    </div>

                                                    <CardDescription className="mt-2">
                                                        <div className="flex items-center gap-4 flex-wrap">
                                                            <div className="flex items-center gap-1">
                                                                <Calendar className="h-4 w-4" />
                                                                <span>Checkout: {formatDate(reservation.checkOut!)} at {formatTime(reservation.checkOut!)}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Users className="h-4 w-4" />
                                                                <span>{guestsData?.total || 1} guests</span>
                                                            </div>
                                                        </div>
                                                    </CardDescription>
                                                </div>
                                                <Button
                                                    onClick={() => handleMarkAsDone(reservation)}
                                                    disabled={markingDone === reservation.id}
                                                    className="bg-green-600 hover:bg-green-700"
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
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-16">
                                <Sparkles className="h-16 w-16 text-gray-400 mb-4" />
                                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                                    No completed cleanings yet
                                </h2>
                                <p className="text-gray-600">
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
                                    <Card key={reservation.id} className="border-green-200 bg-green-50/30">
                                        <CardHeader>
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <Badge className={getPlatformColor(reservation.platform)}>
                                                            {reservation.platform.toUpperCase()}
                                                        </Badge>
                                                        <Badge className="bg-green-100 text-green-800">
                                                            COMPLETED
                                                        </Badge>
                                                        {reservation.code && (
                                                            <span className="text-sm text-gray-600 font-mono">
                                                                {reservation.code}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <CardTitle className="text-xl mb-1">
                                                        {guestData ? `${guestData.first_name} ${guestData.last_name || ''}`.trim() : 'Unknown Guest'}
                                                    </CardTitle>
                                                    
                                                    {/* Property Name */}
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Home className="h-4 w-4 text-blue-600" />
                                                        <span className="text-base font-medium text-blue-900">{getPropertyName(reservation)}</span>
                                                    </div>

                                                    <CardDescription className="mt-2">
                                                        <div className="flex items-center gap-4 flex-wrap">
                                                            <div className="flex items-center gap-1">
                                                                <Calendar className="h-4 w-4" />
                                                                <span>Checkout: {formatDate(reservation.checkOut!)}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Users className="h-4 w-4" />
                                                                <span>{guestsData?.total || 1} guests</span>
                                                            </div>
                                                            {cleaningRecord && (
                                                                <span className="text-sm text-green-600 font-medium">
                                                                    ✓ Marked done {formatDate(cleaningRecord.markedDoneAt)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </CardDescription>
                                                </div>
                                                <CheckCircle className="h-8 w-8 text-green-600" />
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