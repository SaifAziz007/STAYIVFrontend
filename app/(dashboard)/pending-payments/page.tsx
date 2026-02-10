'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, DollarSign, Calendar, Users, Home, Trash2 } from 'lucide-react';
import { pendingPaymentsApi, type PendingPayment } from '@/lib/pending-payments-api';
import { useToast } from '@/hooks/use-toast';

export default function PendingPaymentsPage() {
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const data = await pendingPaymentsApi.getPendingPayments();
      setPayments(data);
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
  };

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
      loadPayments();
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
      loadPayments();
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update payment status',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading pending payments...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Pending Payments</h1>
        <p className="text-gray-600 mt-1">
          Track deposits and refunds for guest reservations
        </p>
      </div>

      {payments.length === 0 ? (
        <Card className="border-gray-200">
          <CardContent className="p-16 text-center">
            <div className="p-4 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl inline-flex mb-6">
              <DollarSign className="h-12 w-12 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pending Payments</h3>
            <p className="text-gray-600">
              Payment records logged from conversations will appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {payments.map((payment) => (
            <Card key={payment.id} className="border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <CardTitle className="text-lg font-semibold text-gray-900">{payment.guestName}</CardTitle>
                      <Badge 
                        className={payment.paymentType === 'deposit' 
                          ? 'bg-green-100 text-green-800 border-green-200' 
                          : 'bg-orange-100 text-orange-800 border-orange-200'}
                      >
                        {payment.paymentType.toUpperCase()}
                      </Badge>
                      <Badge 
                        className={payment.status === 'pending' 
                          ? 'bg-yellow-100 text-yellow-800 border-yellow-200' 
                          : payment.status === 'completed'
                          ? 'bg-green-100 text-green-800 border-green-200'
                          : 'bg-gray-100 text-gray-800 border-gray-200'}
                      >
                        {payment.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm">
                      {payment.propertyName && (
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Home className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{payment.propertyName}</span>
                        </div>
                      )}
                      {payment.reservationCode && (
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <DollarSign className="h-4 w-4 text-gray-500" />
                          <span className="font-mono text-xs">{payment.reservationCode}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>
                          {payment.checkInDate} - {payment.checkOutDate}
                        </span>
                      </div>
                      {payment.numberOfGuests && (
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span>{payment.numberOfGuests} guests</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(payment.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Reason</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg border border-gray-200">
                      {payment.reason}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Created: {new Date(payment.createdAt).toLocaleString()}
                    </p>
                    {payment.status === 'pending' && (
                      <div className="flex gap-2">
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
                      </div>
                    )}
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


