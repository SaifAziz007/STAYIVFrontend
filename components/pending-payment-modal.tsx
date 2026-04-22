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
import { cn } from '@/lib/utils';

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
          <DialogTitle className="flex items-center gap-3 text-foreground">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-950/45">
              <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            Pending Payment
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-muted-foreground">
            Log a pending payment for {reservationData.guestName} at {reservationData.propertyName || 'the property'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-900 dark:text-foreground">Payment Type</Label>
            <RadioGroup value={paymentType} onValueChange={(value) => setPaymentType(value as 'deposit' | 'refund')} className="space-y-3">
              <div
                className={cn(
                  'flex items-center space-x-3 p-3 rounded-lg border transition-colors',
                  paymentType === 'deposit'
                    ? 'border-green-500/50 bg-green-50 dark:bg-green-950/35 dark:border-green-800/60'
                    : 'border-gray-200 bg-transparent hover:bg-gray-50 dark:border-border dark:bg-muted/30 dark:hover:bg-muted/50'
                )}
              >
                <RadioGroupItem value="deposit" id="deposit" className="border-primary dark:border-green-500 dark:text-green-500" />
                <Label htmlFor="deposit" className="font-medium cursor-pointer text-gray-900 dark:text-foreground">
                  Deposit
                </Label>
              </div>
              <div
                className={cn(
                  'flex items-center space-x-3 p-3 rounded-lg border transition-colors',
                  paymentType === 'refund'
                    ? 'border-orange-500/50 bg-orange-50 dark:bg-orange-950/35 dark:border-orange-800/60'
                    : 'border-gray-200 bg-transparent hover:bg-gray-50 dark:border-border dark:bg-muted/30 dark:hover:bg-muted/50'
                )}
              >
                <RadioGroupItem value="refund" id="refund" className="border-primary dark:border-orange-400 dark:text-orange-400" />
                <Label htmlFor="refund" className="font-medium cursor-pointer text-gray-900 dark:text-foreground">
                  Refund
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason" className="text-sm font-semibold text-gray-900 dark:text-foreground">Reason</Label>
            <Textarea
              id="reason"
              placeholder="Enter the reason for this payment..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={5}
              className="resize-none border-gray-300 focus:border-green-500 focus:ring-green-500 dark:border-border dark:focus:border-green-600 dark:focus:ring-green-600/30"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-border">
          <Button variant="outline" onClick={onClose} disabled={submitting} className="min-w-[100px]">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting} className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 min-w-[120px] shadow-sm hover:shadow-md transition-shadow">
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


