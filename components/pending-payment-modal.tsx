'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, DollarSign } from 'lucide-react';
import { pendingPaymentsApi } from '@/lib/pending-payments-api';
import { useToast } from '@/hooks/use-toast';

interface PendingPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservationData: {
    reservationId: string;
    reservationCode: string;
    guestName: string;
    propertyName?: string;
    platform: string;
    checkInDate: string;
    checkOutDate: string;
    numberOfGuests: number;
  };
}

export default function PendingPaymentModal({ isOpen, onClose, reservationData }: PendingPaymentModalProps) {
  const [paymentType, setPaymentType] = useState<'deposit' | 'refund'>('deposit');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a reason for the payment',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      await pendingPaymentsApi.createPendingPayment({
        reservationId: reservationData.reservationId,
        reservationCode: reservationData.reservationCode,
        guestName: reservationData.guestName,
        propertyName: reservationData.propertyName,
        platform: reservationData.platform,
        paymentType,
        reason: reason.trim(),
        checkInDate: reservationData.checkInDate,
        checkOutDate: reservationData.checkOutDate,
        numberOfGuests: reservationData.numberOfGuests,
      });

      toast({
        title: 'Success',
        description: 'Pending payment has been logged successfully',
      });

      // Reset form
      setPaymentType('deposit');
      setReason('');
      onClose();
    } catch (error: any) {
      console.error('Error creating pending payment:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to log pending payment',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            Pending Payment
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Log a pending payment for {reservationData.guestName} at {reservationData.propertyName || 'the property'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-900">Payment Type</Label>
            <RadioGroup value={paymentType} onValueChange={(value) => setPaymentType(value as 'deposit' | 'refund')} className="space-y-3">
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <RadioGroupItem value="deposit" id="deposit" />
                <Label htmlFor="deposit" className="font-medium cursor-pointer text-gray-900">
                  Deposit
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <RadioGroupItem value="refund" id="refund" />
                <Label htmlFor="refund" className="font-medium cursor-pointer text-gray-900">
                  Refund
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason" className="text-sm font-semibold text-gray-900">Reason</Label>
            <Textarea
              id="reason"
              placeholder="Enter the reason for this payment..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={5}
              className="resize-none border-gray-300 focus:border-green-500 focus:ring-green-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <Button variant="outline" onClick={onClose} disabled={submitting} className="min-w-[100px]">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting} className="bg-green-600 hover:bg-green-700 min-w-[120px] shadow-sm hover:shadow-md transition-shadow">
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


