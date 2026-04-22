'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, FileText, Calendar, Users, Home, Trash2 } from 'lucide-react';
import { issuesApi, type Issue } from '@/lib/issues-api';
import { useToast } from '@/hooks/use-toast';
import { usePageHeader } from '@/components/layout/page-header-context';

type IssueStatusTab = 'open' | 'closed';

export default function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState<IssueStatusTab>('open');
  const { toast } = useToast();

  const loadIssues = useCallback(
    async (status: IssueStatusTab) => {
      try {
        setLoading(true);
        const data = await issuesApi.getIssues(status);
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
    },
    [toast],
  );

  useEffect(() => {
    void loadIssues(statusTab);
  }, [statusTab, loadIssues]);

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
      void loadIssues(statusTab);
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
      void loadIssues(statusTab);
    } catch (error) {
      console.error('Error updating issue status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update issue status',
        variant: 'destructive',
      });
    }
  };

  usePageHeader({
    title: statusTab === 'open' ? 'Open Issues' : 'Closed Issues',
    description: 'Track and manage issues reported for guest reservations',
  });

  const emptyTitle =
    statusTab === 'open' ? 'No open issues' : 'No closed issues';
  const emptyDescription =
    statusTab === 'open'
      ? 'Issues logged from conversations will appear here'
      : 'Issues you mark as closed will appear here';

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Tabs
        value={statusTab}
        onValueChange={(v) => setStatusTab(v as IssueStatusTab)}
        className="w-full"
      >
        <TabsList className="grid w-full max-w-md grid-cols-2 sm:w-auto sm:inline-grid">
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="closed">Closed</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="flex items-center justify-center min-h-[320px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-muted-foreground">Loading issues...</p>
          </div>
        </div>
      ) : issues.length === 0 ? (
        <Card className="border-gray-200 dark:border-border">
          <CardContent className="p-16 text-center">
            <div className="p-4 bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-950/45 dark:to-orange-950/40 rounded-2xl inline-flex mb-6">
              <FileText className="h-12 w-12 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground mb-2">{emptyTitle}</h3>
            <p className="text-gray-600 dark:text-muted-foreground">{emptyDescription}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {issues.map((issue) => (
            <Card key={issue.id} className="border-gray-200 dark:border-border hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <CardTitle className="text-lg font-semibold text-gray-900 dark:text-foreground">{issue.guestName}</CardTitle>
                      <Badge
                        variant={issue.status === 'open' ? 'destructive' : 'secondary'}
                        className={
                          issue.status === 'open'
                            ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/45 dark:text-red-300 dark:border-red-800/60'
                            : 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950/45 dark:text-green-300 dark:border-green-800/60'
                        }
                      >
                        {issue.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm">
                      {issue.propertyName && (
                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-muted-foreground">
                          <Home className="h-4 w-4 text-gray-500 dark:text-muted-foreground shrink-0" />
                          <span className="font-medium text-foreground">{issue.propertyName}</span>
                        </div>
                      )}
                      {issue.reservationCode && (
                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-muted-foreground">
                          <FileText className="h-4 w-4 text-gray-500 dark:text-muted-foreground shrink-0" />
                          <span className="font-mono text-xs">{issue.reservationCode}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-muted-foreground">
                        <Calendar className="h-4 w-4 text-gray-500 dark:text-muted-foreground shrink-0" />
                        <span>
                          {issue.checkInDate
                            ? new Date(issue.checkInDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : '—'}
                          {' – '}
                          {issue.checkOutDate
                            ? new Date(issue.checkOutDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : '—'}
                        </span>
                      </div>
                      {issue.numberOfGuests && (
                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-muted-foreground">
                          <Users className="h-4 w-4 text-gray-500 dark:text-muted-foreground shrink-0" />
                          <span>{issue.numberOfGuests} guests</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(issue.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/35 shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {issue.openIssues && (
                    <div>
                      <h4 className="font-semibold text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full shrink-0" />
                        Open Issues
                      </h4>
                      <p className="text-sm text-gray-700 dark:text-neutral-300 whitespace-pre-wrap bg-red-50 dark:bg-red-950/35 p-4 rounded-lg border border-red-200 dark:border-red-900/50">
                        {issue.openIssues}
                      </p>
                    </div>
                  )}
                  {issue.closedIssues && (
                    <div>
                      <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full shrink-0" />
                        Closed Issues
                      </h4>
                      <p className="text-sm text-gray-700 dark:text-neutral-300 whitespace-pre-wrap bg-green-50 dark:bg-green-950/35 p-4 rounded-lg border border-green-200 dark:border-green-900/50">
                        {issue.closedIssues}
                      </p>
                    </div>
                  )}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-3 border-t border-gray-200 dark:border-border">
                    <p className="text-xs text-gray-500 dark:text-muted-foreground">
                      Created: {new Date(issue.createdAt).toLocaleString()}
                    </p>
                    <div className="flex flex-wrap gap-2 justify-end">
                      {issue.status === 'open' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateStatus(issue.id, 'closed')}
                          className="gap-2"
                        >
                          Mark as Closed
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateStatus(issue.id, 'open')}
                          className="gap-2"
                        >
                          Reopen
                        </Button>
                      )}
                    </div>
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


