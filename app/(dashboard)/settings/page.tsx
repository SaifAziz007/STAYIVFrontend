'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, X, RefreshCw, Link2, Unlink } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { authApi } from '@/lib/auth';
import { usePageHeader } from '@/components/layout/page-header-context';

interface ConnectionStatus {
  connected: boolean;
  connectedAt: string | null;
  propertiesCount: number;
  properties: any[];
}

export default function HospitableSettingsPage() {
  const [apiToken, setApiToken] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const response = await apiClient.get('/hospitable/status');
      setStatus(response.data);
    } catch (error: any) {
      console.error('Failed to load status:', error);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const handleConnect = async () => {
    if (!apiToken.trim()) {
      setError('Please enter your Hospitable API token');
      return;
    }

    setIsConnecting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await apiClient.post('/hospitable/connect', { apiToken });
      setSuccessMessage(
        `✅ Connected successfully! Synced ${response.data.propertiesSynced} properties.`
      );
      setApiToken('');
      await loadStatus();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to connect to Hospitable');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await apiClient.post('/hospitable/sync');
      setSuccessMessage(
        `✅ Sync completed! Synced ${response.data.propertiesSynced} properties.`
      );
      await loadStatus();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to sync properties');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your Hospitable account?')) {
      return;
    }

    setIsDisconnecting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await apiClient.delete('/hospitable/disconnect');
      setSuccessMessage('✅ Disconnected successfully');
      await loadStatus();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to disconnect');
    } finally {
      setIsDisconnecting(false);
    }
  };

  usePageHeader({
    title: 'Hospitable Integration',
    description: 'Connect your Hospitable account to automatically sync your properties',
  });

  if (isLoadingStatus) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {authApi.getUser()?.role === 'ADMIN' && (
        <p className="mb-6">
          <Link
            href="/settings/team"
            className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
          >
            Manage team members →
          </Link>
        </p>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/35 border border-red-200 dark:border-red-900/50 rounded-lg flex items-start">
          <X className="h-5 w-5 text-red-600 dark:text-red-400 mr-3 mt-0.5 shrink-0" />
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-950/35 border border-green-200 dark:border-green-900/50 rounded-lg flex items-start">
          <Check className="h-5 w-5 text-green-600 dark:text-green-400 mr-3 mt-0.5 shrink-0" />
          <p className="text-green-800 dark:text-green-200">{successMessage}</p>
        </div>
      )}

      {!status?.connected ? (
        /* Not Connected */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Link2 className="mr-2 h-5 w-5" />
              Connect Your Hospitable Account
            </CardTitle>
            <CardDescription>
              Enter your Hospitable API token to sync your properties automatically
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="apiToken" className="text-sm font-medium text-foreground">
                Hospitable API Token
              </label>
              <Input
                id="apiToken"
                type="password"
                placeholder="Enter your API token..."
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleConnect();
                  }
                }}
                disabled={isConnecting}
              />
              <p className="text-xs text-muted-foreground">
                You can find your API token in your Hospitable account settings
              </p>
            </div>

            <Button
              onClick={handleConnect}
              disabled={isConnecting || !apiToken.trim()}
              className="w-full"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting & Syncing...
                </>
              ) : (
                <>
                  <Link2 className="mr-2 h-4 w-4" />
                  Connect Hospitable
                </>
              )}
            </Button>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/35 border border-blue-200 dark:border-blue-900/50 rounded-lg">
              <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                How to get your API token:
              </h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800 dark:text-blue-200/90">
                <li>Log in to your Hospitable account</li>
                <li>Go to Settings → API & Integrations</li>
                <li>Generate or copy your API token</li>
                <li>Paste it above and click Connect</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Connected */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center flex-wrap gap-2">
              <Check className="mr-2 h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
              Connected to Hospitable
              <Badge variant="secondary" className="ml-auto dark:bg-muted dark:text-muted-foreground dark:border-border">
                Active
              </Badge>
            </CardTitle>
            <CardDescription>
              Your Hospitable account is connected and syncing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Connection Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted rounded-lg border border-transparent dark:border-border">
                <div className="text-2xl font-bold text-foreground">{status.propertiesCount}</div>
                <div className="text-sm text-muted-foreground">Properties Synced</div>
              </div>
              <div className="p-4 bg-muted rounded-lg border border-transparent dark:border-border">
                <div className="text-sm font-medium text-foreground">Connected At</div>
                <div className="text-xs text-muted-foreground">
                  {status.connectedAt
                    ? new Date(status.connectedAt).toLocaleString()
                    : 'N/A'}
                </div>
              </div>
            </div>

            {/* Synced Properties List */}
            {status.properties && status.properties.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-foreground">Synced Properties</h4>
                <div className="border border-gray-200 dark:border-border rounded-lg divide-y divide-gray-200 dark:divide-border max-h-64 overflow-y-auto">
                  {status.properties.map((property) => (
                    <div
                      key={property.id}
                      className="p-3 flex items-center justify-between gap-3 hover:bg-muted/50"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground">
                          Property ID: {property.hospitablePropertyId}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Last synced:{' '}
                          {property.lastSyncedAt
                            ? new Date(property.lastSyncedAt).toLocaleString()
                            : 'Never'}
                        </div>
                      </div>
                      <Badge
                        variant={
                          property.syncStatus === 'synced'
                            ? 'default'
                            : property.syncStatus === 'pending'
                            ? 'secondary'
                            : 'destructive'
                        }
                      >
                        {property.syncStatus}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={handleSync}
                disabled={isSyncing}
                className="flex-1"
                variant="outline"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Re-sync Properties
                  </>
                )}
              </Button>

              <Button
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                variant="destructive"
              >
                {isDisconnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Disconnecting...
                  </>
                ) : (
                  <>
                    <Unlink className="mr-2 h-4 w-4" />
                    Disconnect
                  </>
                )}
              </Button>
            </div>

            {/* Info Box */}
            <div className="p-4 bg-blue-50 dark:bg-blue-950/35 border border-blue-200 dark:border-blue-900/50 rounded-lg">
              <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                Automatic Sync
              </h4>
              <p className="text-sm text-blue-800 dark:text-blue-200/90">
                Webhooks are configured to automatically sync changes from Hospitable.
                When you create, update, or delete a property in Hospitable, it will be
                automatically reflected here.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Webhook URL Info */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-sm">Webhook Configuration</CardTitle>
          <CardDescription>Configure this webhook URL in your Hospitable account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-3 bg-muted rounded-lg font-mono text-sm break-all text-foreground border border-transparent dark:border-border">
            {typeof window !== 'undefined'
              ? `${window.location.origin.replace(':3000', ':3001')}/api/webhooks/hospitable`
              : 'Loading...'}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Add this URL to your Hospitable webhook settings for automatic property sync
          </p>
        </CardContent>
      </Card>
    </div>
  );
}








