'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Flag, AlertTriangle, Search, Upload, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { claimedChatsApi } from '@/lib/claimed-chats-api';
import { reviewRemovalApi } from '@/lib/review-removal-api';
import { lostAndFoundApi } from '@/lib/lost-found-api';

interface ReservationData {
    reservationId: string;
    reservationCode: string;
    guestName: string;
    guestEmail: string;
    guestPhone: string;
    propertyName: string;
    checkInDate: string;
    checkOutDate: string;
    platform: string;
    numberOfGuests: number;
    conversationId: string;
}

interface ClaimChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    actionType: 'claim' | 'review' | 'lost-found';
    reservationData: ReservationData;
}

export default function ClaimChatModal({
    isOpen,
    onClose,
    actionType,
    reservationData
}: ClaimChatModalProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [files, setFiles] = useState<File[]>([]);

    // Form fields
    const [claimReason, setClaimReason] = useState('');
    const [notes, setNotes] = useState('');
    const [itemDescription, setItemDescription] = useState('');
    const [itemLocation, setItemLocation] = useState('');

    const getActionConfig = () => {
        switch (actionType) {
            case 'claim':
                return {
                    title: 'Mark as Claimed',
                    icon: Flag,
                    iconColor: 'text-blue-600',
                    submitText: 'Mark as Claimed',
                    submitColor: 'bg-blue-600 hover:bg-blue-700'
                };
            case 'review':
                return {
                    title: 'Review/Removal Request',
                    icon: AlertTriangle,
                    iconColor: 'text-orange-600',
                    submitText: 'Submit Review Request',
                    submitColor: 'bg-orange-600 hover:bg-orange-700'
                };
            case 'lost-found':
                return {
                    title: 'Lost & Found Report',
                    icon: Search,
                    iconColor: 'text-purple-600',
                    submitText: 'Submit Report',
                    submitColor: 'bg-purple-600 hover:bg-purple-700'
                };
        }
    };

    const config = getActionConfig();
    const IconComponent = config.icon;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);

            // Validate file types based on action
            const allowedTypes = actionType === 'lost-found'
                ? ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
                : ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

            const validFiles = newFiles.filter(file => allowedTypes.includes(file.type));

            if (validFiles.length !== newFiles.length) {
                toast({
                    title: 'Invalid file type',
                    description: actionType === 'lost-found'
                        ? 'Only image files are allowed for Lost & Found reports.'
                        : 'Only image and PDF files are allowed.',
                    variant: 'destructive'
                });
            }

            setFiles(prev => [...prev, ...validFiles]);
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    // Helper function to convert file to base64
    const fileToBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          const result = reader.result as string;
          // Remove the data URL prefix (e.g., "data:image/png;base64,")
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = error => reject(error);
      });
    };

    // Convert all files to base64
    const attachments = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        type: file.type,
        data: await fileToBase64(file), // Convert to base64
      }))
    );

    // Create data object matching backend DTO
    const data = {
      // Required fields matching backend DTO
      reservationId: reservationData.reservationId,
      reservationCode: reservationData.reservationCode,
      guestName: reservationData.guestName,
      guestEmail: reservationData.guestEmail,
      guestPhone: reservationData.guestPhone,
      propertyName: reservationData.propertyName,
      platform: reservationData.platform,
      checkInDate: reservationData.checkInDate,     // Changed from checkInDate
      checkOutDate: reservationData.checkOutDate,  // Changed from checkOutDate
      numberOfGuests: reservationData.numberOfGuests,
      
      // Action-specific fields
      ...(actionType === 'claim' && {
        claimReason,
        notes,
      }),
      ...(actionType === 'review' && {
        notes,
      }),
      ...(actionType === 'lost-found' && {
        itemDescription,
        itemLocation,
        notes,
      }),
      
      // Complete reservation data object
      reservationData: reservationData,
      
      // File attachments with base64 data
      attachments: attachments,
    };

    // Call appropriate API
    let response;
    if (actionType === 'claim') {
      response = await claimedChatsApi.createClaimedChat(data);
    } else if (actionType === 'review') {
      response = await reviewRemovalApi.createReviewRemoval(data);
    } else {
      response = await lostAndFoundApi.createLostAndFound(data);
    }

    toast({
      title: 'Success!',
      description: `${config.title} submitted successfully.`,
    });

    onClose();
    
    // Reset form
    setClaimReason('');
    setNotes('');
    setItemDescription('');
    setItemLocation('');
    setFiles([]);

  } catch (error: any) {
    console.error(`Failed to submit ${actionType}:`, error);
    toast({
      title: 'Error',
      description: error.response?.data?.message || `Failed to submit ${config.title.toLowerCase()}.`,
      variant: 'destructive'
    });
  } finally {
    setLoading(false);
  }
};
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <IconComponent className={`h-5 w-5 ${config.iconColor}`} />
                        {config.title}
                    </DialogTitle>
                </DialogHeader>

                {/* Reservation Details */}
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <h3 className="font-semibold text-gray-900">Reservation Details</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-600">Guest:</span>
                            <span className="ml-2 font-medium">{reservationData.guestName}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Code:</span>
                            <span className="ml-2 font-mono">{reservationData.reservationCode}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Check-in:</span>
                            <span className="ml-2">{new Date(reservationData.checkInDate).toLocaleDateString()}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Check-out:</span>
                            <span className="ml-2">{new Date(reservationData.checkOutDate).toLocaleDateString()}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Platform:</span>
                            <Badge className="ml-2" variant="outline">{reservationData.platform.toUpperCase()}</Badge>
                        </div>
                        <div>
                            <span className="text-gray-600">Guests:</span>
                            <span className="ml-2">{reservationData.numberOfGuests}</span>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Claim-specific fields */}
                    {actionType === 'claim' && (
                        <div className="space-y-2">
                            <Label htmlFor="claimReason">Claim Reason *</Label>
                            <Input
                                id="claimReason"
                                value={claimReason}
                                onChange={(e) => setClaimReason(e.target.value)}
                                placeholder="Why are you claiming this conversation?"
                                required
                            />
                        </div>
                    )}

                    {/* Lost & Found specific fields */}
                    {actionType === 'lost-found' && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="itemDescription">Item Description *</Label>
                                <Input
                                    id="itemDescription"
                                    value={itemDescription}
                                    onChange={(e) => setItemDescription(e.target.value)}
                                    placeholder="Describe the lost item"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="itemLocation">Last Known Location</Label>
                                <Input
                                    id="itemLocation"
                                    value={itemLocation}
                                    onChange={(e) => setItemLocation(e.target.value)}
                                    placeholder="Where was the item last seen?"
                                />
                            </div>
                        </>
                    )}

                    {/* Notes field (for all actions) */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">
                            {actionType === 'review' ? 'Review Details *' : 'Additional Notes'}
                        </Label>
                        <Textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder={
                                actionType === 'review'
                                    ? "Describe the issue or reason for review/removal..."
                                    : "Any additional information..."
                            }
                            rows={3}
                            required={actionType === 'review'}
                        />
                    </div>

                    {/* File Upload */}
                    <div className="space-y-2">
                        <Label>
                            Attachments {actionType === 'lost-found' ? '(Images only)' : '(Images & PDFs)'}
                        </Label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                            <input
                                type="file"
                                multiple
                                accept={actionType === 'lost-found' ? 'image/*' : 'image/*,.pdf'}
                                onChange={handleFileChange}
                                className="hidden"
                                id="file-upload"
                            />
                            <label
                                htmlFor="file-upload"
                                className="flex flex-col items-center justify-center cursor-pointer"
                            >
                                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                                <span className="text-sm text-gray-600">
                                    Click to upload files or drag and drop
                                </span>
                                <span className="text-xs text-gray-500 mt-1">
                                    {actionType === 'lost-found' ? 'PNG, JPG, GIF up to 10MB each' : 'PNG, JPG, GIF, PDF up to 10MB each'}
                                </span>
                            </label>
                        </div>

                        {/* File List */}
                        {files.length > 0 && (
                            <div className="space-y-2">
                                {files.map((file, index) => (
                                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                        <span className="text-sm text-gray-700 truncate">{file.name}</span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeFile(index)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className={config.submitColor}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                config.submitText
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}