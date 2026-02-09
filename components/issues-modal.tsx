'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { issuesApi } from '@/lib/issues-api';
import { useToast } from '@/hooks/use-toast';

interface IssuesModalProps {
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

export default function IssuesModal({ isOpen, onClose, reservationData }: IssuesModalProps) {
  const [openIssues, setOpenIssues] = useState('');
  const [closedIssues, setClosedIssues] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!openIssues.trim() && !closedIssues.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter at least one issue (open or closed)',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      await issuesApi.createIssue({
        reservationId: reservationData.reservationId,
        reservationCode: reservationData.reservationCode,
        guestName: reservationData.guestName,
        propertyName: reservationData.propertyName,
        platform: reservationData.platform,
        openIssues: openIssues.trim() || undefined,
        closedIssues: closedIssues.trim() || undefined,
        checkInDate: reservationData.checkInDate,
        checkOutDate: reservationData.checkOutDate,
        numberOfGuests: reservationData.numberOfGuests,
      });

      toast({
        title: 'Success',
        description: 'Issue has been logged successfully',
      });

      // Reset form
      setOpenIssues('');
      setClosedIssues('');
      onClose();
    } catch (error: any) {
      console.error('Error creating issue:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to log issue',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Open Issues</DialogTitle>
          <DialogDescription>
            Log issues for {reservationData.guestName} at {reservationData.propertyName || 'the property'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="openIssues">Open Issues</Label>
            <Textarea
              id="openIssues"
              placeholder="Describe any open or unresolved issues..."
              value={openIssues}
              onChange={(e) => setOpenIssues(e.target.value)}
              rows={5}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="closedIssues">Closed Issues</Label>
            <Textarea
              id="closedIssues"
              placeholder="Describe any resolved or closed issues..."
              value={closedIssues}
              onChange={(e) => setClosedIssues(e.target.value)}
              rows={5}
              className="resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
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


