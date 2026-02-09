'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, Calendar, Users, Home, Trash2 } from 'lucide-react';
import { issuesApi, type Issue } from '@/lib/issues-api';
import { useToast } from '@/hooks/use-toast';

export default function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadIssues();
  }, []);

  const loadIssues = async () => {
    try {
      setLoading(true);
      const data = await issuesApi.getIssues();
      setIssues(data);
    } catch (error) {
      console.error('Error loading issues:', error);
      toast({
        title: 'Error',
        description: 'Failed to load issues',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this issue?')) {
      return;
    }

    try {
      await issuesApi.deleteIssue(id);
      toast({
        title: 'Success',
        description: 'Issue deleted successfully',
      });
      loadIssues();
    } catch (error) {
      console.error('Error deleting issue:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete issue',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await issuesApi.updateIssueStatus(id, newStatus);
      toast({
        title: 'Success',
        description: 'Issue status updated successfully',
      });
      loadIssues();
    } catch (error) {
      console.error('Error updating issue status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update issue status',
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
            <p className="text-gray-600">Loading issues...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Open Issues</h1>
        <p className="text-gray-600 mt-1">
          Track and manage issues reported for guest reservations
        </p>
      </div>

      {issues.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Issues Found</h3>
            <p className="text-gray-600">
              Issues logged from conversations will appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {issues.map((issue) => (
            <Card key={issue.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{issue.guestName}</CardTitle>
                      <Badge variant={issue.status === 'open' ? 'destructive' : 'secondary'}>
                        {issue.status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      {issue.propertyName && (
                        <div className="flex items-center gap-1">
                          <Home className="h-4 w-4" />
                          <span>{issue.propertyName}</span>
                        </div>
                      )}
                      {issue.reservationCode && (
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          <span>{issue.reservationCode}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {issue.checkInDate} - {issue.checkOutDate}
                        </span>
                      </div>
                      {issue.numberOfGuests && (
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{issue.numberOfGuests} guests</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(issue.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {issue.openIssues && (
                    <div>
                      <h4 className="font-medium text-red-700 mb-2">Open Issues</h4>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap bg-red-50 p-3 rounded-lg border border-red-200">
                        {issue.openIssues}
                      </p>
                    </div>
                  )}
                  {issue.closedIssues && (
                    <div>
                      <h4 className="font-medium text-green-700 mb-2">Closed Issues</h4>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap bg-green-50 p-3 rounded-lg border border-green-200">
                        {issue.closedIssues}
                      </p>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <p className="text-xs text-gray-500">
                      Created: {new Date(issue.createdAt).toLocaleString()}
                    </p>
                    {issue.status === 'open' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateStatus(issue.id, 'closed')}
                      >
                        Mark as Closed
                      </Button>
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


