'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, Calendar, Users, Home, Trash2, Download, File } from 'lucide-react';
import { formCollectionApi, type FormCollection } from '@/lib/form-collection-api';
import { useToast } from '@/hooks/use-toast';
import { usePageHeader } from '@/components/layout/page-header-context';

function formatStayDate(value?: string): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

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

  usePageHeader({
    title: 'Form Collection',
    description: 'Documents and forms collected from guest reservations',
  });

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-muted-foreground">Loading form collections...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {forms.length === 0 ? (
        <Card className="border-gray-200 dark:border-border">
          <CardContent className="p-16 text-center">
            <div className="p-4 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-950/45 dark:to-purple-950/40 rounded-2xl inline-flex mb-6">
              <Upload className="h-12 w-12 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground mb-2">No Forms Collected</h3>
            <p className="text-gray-600 dark:text-muted-foreground">
              Forms uploaded from conversations will appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {forms.map((form) => (
            <Card key={form.id} className="border-gray-200 dark:border-border hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <CardTitle className="text-lg font-semibold text-gray-900 dark:text-foreground">{form.guestName}</CardTitle>
                      <Badge
                        variant="outline"
                        className="uppercase bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/45 dark:text-indigo-300 dark:border-indigo-800/60"
                      >
                        {form.fileType}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm">
                      {form.propertyName && (
                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-muted-foreground">
                          <Home className="h-4 w-4 text-gray-500 dark:text-muted-foreground shrink-0" />
                          <span className="font-medium text-foreground">{form.propertyName}</span>
                        </div>
                      )}
                      {form.reservationCode && (
                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-muted-foreground">
                          <File className="h-4 w-4 text-gray-500 dark:text-muted-foreground shrink-0" />
                          <span className="font-mono text-xs">{form.reservationCode}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-muted-foreground">
                        <Calendar className="h-4 w-4 text-gray-500 dark:text-muted-foreground shrink-0" />
                        <span>
                          {formatStayDate(form.checkInDate)} – {formatStayDate(form.checkOutDate)}
                        </span>
                      </div>
                      {form.numberOfGuests && (
                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-muted-foreground">
                          <Users className="h-4 w-4 text-gray-500 dark:text-muted-foreground shrink-0" />
                          <span>{form.numberOfGuests} guests</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(form.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/35 shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/35 dark:to-purple-950/35 p-4 rounded-lg border border-indigo-200 dark:border-indigo-900/50">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-indigo-100 dark:bg-indigo-950/50 rounded-lg shrink-0">
                        <File className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-foreground truncate">{form.fileName}</p>
                        <p className="text-sm text-gray-500 dark:text-muted-foreground">{formatFileSize(form.fileSize)}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(form.fileUrl, form.fileName)}
                      className="gap-2 shrink-0 w-full sm:w-auto"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-border">
                    <p className="text-xs text-gray-500 dark:text-muted-foreground">
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


