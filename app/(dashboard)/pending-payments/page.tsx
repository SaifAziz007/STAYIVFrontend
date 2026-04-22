'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, DollarSign, Calendar, Users, Home, Trash2 } from 'lucide-react';
import { pendingPaymentsApi, type PendingPayment } from '@/lib/pending-payments-api';
import { useToast } from '@/hooks/use-toast';
import { usePageHeader } from '@/components/layout/page-header-context';

type PaymentStatusTab = 'pending' | 'closed';

function formatStayDate(value?: string): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function mergeClosedPayments(completed: PendingPayment[], cancelled: PendingPayment[]): PendingPayment[] {
  const byId = new Map<string, PendingPayment>();
  for (const p of [...completed, ...cancelled]) {
    byId.set(p.id, p);
  }
  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export default function PendingPaymentsPage() {
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState<PaymentStatusTab>('pending');
  const { toast } = useToast();

  const loadPayments = useCallback(
    async (tab: PaymentStatusTab) => {
      try {
        setLoading(true);
        if (tab === 'pending') {
          const data = await pendingPaymentsApi.getPendingPayments('pending');
          setPayments(data);
        } else {
          const [completed, cancelled] = await Promise.all([
            pendingPaymentsApi.getPendingPayments('completed').catch(() => [] as PendingPayment[]),
            pendingPaymentsApi.getPendingPayments('cancelled').catch(() => [] as PendingPayment[]),
          ]);
          setPayments(mergeClosedPayments(completed, cancelled));
        }
      } catch (error) {
        console.error('Error loading payments:', error);
        toast({
          title: 'Error',
          description: 'Failed to load pending payments',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    void loadPayments(statusTab);
  }, [statusTab, loadPayments]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment record?')) {
      return;
    }

    try {
      await pendingPaymentsApi.deletePayment(id);
      toast({
        title: 'Success',
        description: 'Payment record deleted successfully',
      });
      void loadPayments(statusTab);
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete payment record',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await pendingPaymentsApi.updatePaymentStatus(id, newStatus);
      toast({
        title: 'Success',
        description: 'Payment status updated successfully',
      });
      void loadPayments(statusTab);
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update payment status',
        variant: 'destructive',
      });
    }
  };

  usePageHeader({
    title: statusTab === 'pending' ? 'Pending Payments' : 'Closed Payments',
    description: 'Track deposits and refunds for guest reservations',
  });

  const emptyTitle =
    statusTab === 'pending' ? 'No pending payments' : 'No closed payment records';
  const emptyDescription =
    statusTab === 'pending'
      ? 'Payment records logged from conversations will appear here'
      : 'Payments you mark as completed or cancelled will appear here';

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Tabs
        value={statusTab}
        onValueChange={(v) => setStatusTab(v as PaymentStatusTab)}
        className="w-full"
      >
        <TabsList className="grid w-full max-w-md grid-cols-2 sm:w-auto sm:inline-grid">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="closed">Closed</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="flex items-center justify-center min-h-[320px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-muted-foreground">Loading pending payments...</p>
          </div>
        </div>
      ) : payments.length === 0 ? (
        <Card className="border-gray-200 dark:border-border">
          <CardContent className="p-16 text-center">
            <div className="p-4 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-950/45 dark:to-emerald-950/40 rounded-2xl inline-flex mb-6">
              <DollarSign className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground mb-2">{emptyTitle}</h3>
            <p className="text-gray-600 dark:text-muted-foreground">{emptyDescription}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {payments.map((payment) => (
            <Card key={payment.id} className="border-gray-200 dark:border-border hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <CardTitle className="text-lg font-semibold text-gray-900 dark:text-foreground">{payment.guestName}</CardTitle>
                      <Badge 
                        className={payment.paymentType === 'deposit' 
                          ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950/45 dark:text-green-300 dark:border-green-800/60' 
                          : 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/45 dark:text-orange-300 dark:border-orange-800/60'}
                      >
                        {payment.paymentType.toUpperCase()}
                      </Badge>
                      <Badge 
                        className={payment.status === 'pending' 
                          ? 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950/45 dark:text-yellow-200 dark:border-yellow-800/60' 
                          : payment.status === 'completed'
                          ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950/45 dark:text-green-300 dark:border-green-800/60'
                          : 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-muted dark:text-muted-foreground dark:border-border'}
                      >
                        {payment.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm">
                      {payment.propertyName && (
                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-muted-foreground">
                          <Home className="h-4 w-4 text-gray-500 dark:text-muted-foreground shrink-0" />
                          <span className="font-medium text-foreground">{payment.propertyName}</span>
                        </div>
                      )}
                      {payment.reservationCode && (
                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-muted-foreground">
                          <DollarSign className="h-4 w-4 text-gray-500 dark:text-muted-foreground shrink-0" />
                          <span className="font-mono text-xs">{payment.reservationCode}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-muted-foreground">
                        <Calendar className="h-4 w-4 text-gray-500 dark:text-muted-foreground shrink-0" />
                        <span>
                          {formatStayDate(payment.checkInDate)} – {formatStayDate(payment.checkOutDate)}
                        </span>
                      </div>
                      {payment.numberOfGuests && (
                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-muted-foreground">
                          <Users className="h-4 w-4 text-gray-500 dark:text-muted-foreground shrink-0" />
                          <span>{payment.numberOfGuests} guests</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(payment.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/35 shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-foreground mb-2">Reason</h4>
                    <p className="text-sm text-gray-700 dark:text-neutral-300 whitespace-pre-wrap bg-gray-50 dark:bg-muted/60 p-4 rounded-lg border border-gray-200 dark:border-border">
                      {payment.reason}
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-3 border-t border-gray-200 dark:border-border">
                    <p className="text-xs text-gray-500 dark:text-muted-foreground">
                      Created: {new Date(payment.createdAt).toLocaleString()}
                    </p>
                    <div className="flex flex-wrap gap-2 justify-end">
                      {payment.status === 'pending' ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateStatus(payment.id, 'completed')}
                            className="gap-2"
                          >
                            Mark as Completed
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateStatus(payment.id, 'cancelled')}
                            className="gap-2"
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateStatus(payment.id, 'pending')}
                          className="gap-2"
                        >
                          Reopen
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}


