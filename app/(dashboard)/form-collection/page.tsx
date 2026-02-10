'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, Calendar, Users, Home, Trash2, Download, File } from 'lucide-react';
import { formCollectionApi, type FormCollection } from '@/lib/form-collection-api';
import { useToast } from '@/hooks/use-toast';

export default function FormCollectionPage() {
  const [forms, setForms] = useState<FormCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    try {
      setLoading(true);
      const data = await formCollectionApi.getFormCollections();
      setForms(data);
    } catch (error) {
      console.error('Error loading forms:', error);
      toast({
        title: 'Error',
        description: 'Failed to load form collections',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this form?')) {
      return;
    }

    try {
      await formCollectionApi.deleteFormCollection(id);
      toast({
        title: 'Success',
        description: 'Form deleted successfully',
      });
      loadForms();
    } catch (error) {
      console.error('Error deleting form:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete form',
        variant: 'destructive',
      });
    }
  };

  const handleDownload = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading form collections...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Form Collection</h1>
        <p className="text-gray-600 mt-1">
          Documents and forms collected from guest reservations
        </p>
      </div>

      {forms.length === 0 ? (
        <Card className="border-gray-200">
          <CardContent className="p-16 text-center">
            <div className="p-4 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl inline-flex mb-6">
              <Upload className="h-12 w-12 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Forms Collected</h3>
            <p className="text-gray-600">
              Forms uploaded from conversations will appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {forms.map((form) => (
            <Card key={form.id} className="border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <CardTitle className="text-lg font-semibold text-gray-900">{form.guestName}</CardTitle>
                      <Badge variant="outline" className="uppercase bg-indigo-50 text-indigo-700 border-indigo-200">
                        {form.fileType}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm">
                      {form.propertyName && (
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Home className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{form.propertyName}</span>
                        </div>
                      )}
                      {form.reservationCode && (
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <File className="h-4 w-4 text-gray-500" />
                          <span className="font-mono text-xs">{form.reservationCode}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>
                          {form.checkInDate} - {form.checkOutDate}
                        </span>
                      </div>
                      {form.numberOfGuests && (
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span>{form.numberOfGuests} guests</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(form.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <File className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{form.fileName}</p>
                        <p className="text-sm text-gray-500">{formatFileSize(form.fileSize)}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(form.fileUrl, form.fileName)}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Uploaded: {new Date(form.createdAt).toLocaleString()}
                    </p>
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


