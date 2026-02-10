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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Open Issues</h1>
        <p className="text-gray-600 mt-1">
          Track and manage issues reported for guest reservations
        </p>
      </div>

      {issues.length === 0 ? (
        <Card className="border-gray-200">
          <CardContent className="p-16 text-center">
            <div className="p-4 bg-gradient-to-br from-red-100 to-orange-100 rounded-2xl inline-flex mb-6">
              <FileText className="h-12 w-12 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Issues Found</h3>
            <p className="text-gray-600">
              Issues logged from conversations will appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {issues.map((issue) => (
            <Card key={issue.id} className="border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <CardTitle className="text-lg font-semibold text-gray-900">{issue.guestName}</CardTitle>
                      <Badge 
                        variant={issue.status === 'open' ? 'destructive' : 'secondary'}
                        className={issue.status === 'open' ? 'bg-red-100 text-red-800 border-red-200' : 'bg-gray-100 text-gray-800 border-gray-200'}
                      >
                        {issue.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm">
                      {issue.propertyName && (
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Home className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{issue.propertyName}</span>
                        </div>
                      )}
                      {issue.reservationCode && (
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="font-mono text-xs">{issue.reservationCode}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>
                          {issue.checkInDate} - {issue.checkOutDate}
                        </span>
                      </div>
                      {issue.numberOfGuests && (
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span>{issue.numberOfGuests} guests</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(issue.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {issue.openIssues && (
                    <div>
                      <h4 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        Open Issues
                      </h4>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap bg-red-50 p-4 rounded-lg border border-red-200">
                        {issue.openIssues}
                      </p>
                    </div>
                  )}
                  {issue.closedIssues && (
                    <div>
                      <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        Closed Issues
                      </h4>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap bg-green-50 p-4 rounded-lg border border-green-200">
                        {issue.closedIssues}
                      </p>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Created: {new Date(issue.createdAt).toLocaleString()}
                    </p>
                    {issue.status === 'open' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateStatus(issue.id, 'closed')}
                        className="gap-2"
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


