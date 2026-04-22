'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Zap, RefreshCw, AlertCircle } from 'lucide-react';
import { conversationsApi } from '@/lib/conversations-api';
import { usePageHeader } from '@/components/layout/page-header-context';

export default function ChatsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationCount, setConversationCount] = useState(0);

  useEffect(() => {
    loadConversationCount();
    setLoading(false);
  }, []);

  const loadConversationCount = async () => {
    try {
      const response = await conversationsApi.getConversations(1, 1);
      setConversationCount(response.pagination.total || 0);
    } catch (error) {
      console.error('Failed to load conversation count:', error);
    }
  };

  const handleSyncConversations = async () => {
    try {
      setSyncing(true);
      setError(null);
      
      await conversationsApi.syncConversations();
      await loadConversationCount(); // Reload count after sync
      
      console.log('Conversations synced successfully');
    } catch (error) {
      console.error('Error syncing conversations:', error);
      setError('Failed to sync conversations. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const handleViewAllConversations = () => {
    router.push('/chats/all');
  };

  const syncChatsRef = useRef(handleSyncConversations);
  syncChatsRef.current = handleSyncConversations;
  const chatsLandingActions = useMemo(
    () => (
      <Button onClick={() => void syncChatsRef.current()} disabled={syncing} variant="outline">
        {syncing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Syncing...
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync from Hospitable
          </>
        )}
      </Button>
    ),
    [syncing],
  );

  usePageHeader({
    title: 'Guest Chats',
    description: 'View and manage guest inquiries and conversations',
    actions: chatsLandingActions,
  });

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading chat options...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">View All Conversations</h2>
            <p className="text-gray-600 mb-6">See all recent conversations across all properties</p>
            
            {/* View Latest Chats - Single Card */}
            <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-200 max-w-md mx-auto" onClick={handleViewAllConversations}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-center mb-4">
                    <div className="p-3 bg-blue-100 rounded-full">
                      <Zap className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">View Latest Chats</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    See all recent conversations across all properties
                  </p>
                  {conversationCount > 0 && (
                    <Badge variant="secondary" className="mb-4">
                      {conversationCount} conversations available
                    </Badge>
                  )}
                  <Button className="w-full">
                    View All Conversations
                  </Button>
                </CardContent>
              </Card>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}