'use client';

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, File, X } from 'lucide-react';
import { formCollectionApi } from '@/lib/form-collection-api';
import { useToast } from '@/hooks/use-toast';

interface FormCollectionModalProps {
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

export default function FormCollectionModal({ isOpen, onClose, reservationData }: FormCollectionModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
      ];

      if (!allowedTypes.includes(file.type)) {
        toast({
          title: 'Invalid File Type',
          description: 'Please upload a PDF, DOC, DOCX, XLS, XLSX, or CSV file',
          variant: 'destructive',
        });
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File Too Large',
          description: 'File size must be less than 10MB',
          variant: 'destructive',
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast({
        title: 'Validation Error',
        description: 'Please select a file to upload',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploading(true);

      // Convert file to base64
      const base64Data = await fileToBase64(selectedFile);

      // Get file extension
      const fileExtension = selectedFile.name.split('.').pop() || '';

      // Create form collection record with base64 data
      await formCollectionApi.createFormCollection({
        reservationId: reservationData.reservationId,
        reservationCode: reservationData.reservationCode,
        guestName: reservationData.guestName,
        propertyName: reservationData.propertyName,
        platform: reservationData.platform,
        fileName: selectedFile.name,
        fileType: fileExtension,
        fileSize: selectedFile.size,
        fileUrl: base64Data, // Store base64 data as fileUrl
        checkInDate: reservationData.checkInDate,
        checkOutDate: reservationData.checkOutDate,
        numberOfGuests: reservationData.numberOfGuests,
      });

      toast({
        title: 'Success',
        description: 'Form has been uploaded successfully',
      });

      // Reset form
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onClose();
    } catch (error: any) {
      console.error('Error uploading form:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to upload form',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-foreground">
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-950/45">
              <Upload className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            Form Collection
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-muted-foreground">
            Upload a form for {reservationData.guestName} at {reservationData.propertyName || 'the property'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-900 dark:text-foreground">Upload File (PDF, DOC, DOCX, XLS, XLSX, CSV)</Label>
            
            {!selectedFile ? (
              <div
                className="border-2 border-dashed border-gray-300 dark:border-border rounded-xl p-8 text-center hover:border-indigo-400 dark:hover:border-indigo-500/60 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/25 transition-all cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="p-3 bg-gray-100 dark:bg-muted rounded-lg inline-flex mb-3">
                  <Upload className="h-6 w-6 text-gray-500 dark:text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-foreground mb-1">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500 dark:text-muted-foreground">
                  PDF, DOC, DOCX, XLS, XLSX, CSV (max 10MB)
                </p>
              </div>
            ) : (
              <div className="border border-gray-300 dark:border-border rounded-xl p-4 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/35 dark:to-purple-950/35 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-950/50 rounded-lg shrink-0">
                    <File className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-foreground truncate">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500 dark:text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveFile}
                  disabled={uploading}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/35 shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-border">
          <Button variant="outline" onClick={onClose} disabled={uploading} className="min-w-[100px]">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={uploading || !selectedFile} className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 min-w-[120px] shadow-sm hover:shadow-md transition-shadow">
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
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
