'use client';

import { useEffect, useState } from 'react';
import { authApi, User } from '@/lib/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, MessageSquare, Settings, Sparkles } from 'lucide-react';

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(authApi.getUser());
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome Section */}
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
          <Sparkles className="h-10 w-10 text-blue-600" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to StayIV
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          {user?.name ? `Hi ${user.name}! ` : ''}
          Your AI-powered property management platform for vacation rentals
        </p>
      </div>

      {/* Quick Stats/Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Properties</h3>
                <p className="text-sm text-gray-600">
                  Manage your vacation rental properties and keep them up to date
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <MessageSquare className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">AI Chat</h3>
                <p className="text-sm text-gray-600">
                  Chat with your properties&apos; AI assistant and test responses
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Settings className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Settings</h3>
                <p className="text-sm text-gray-600">
                  Configure integrations and manage your account settings
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Getting Started Section */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Getting Started
          </h2>
          <div className="space-y-3 text-gray-700">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <p className="font-medium">Add Your Properties</p>
                <p className="text-sm text-gray-600">
                  Navigate to <span className="font-medium">Properties</span> to add and manage your vacation rentals
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <p className="font-medium">Fill Property Sheets</p>
                <p className="text-sm text-gray-600">
                  Complete property information to train the AI for better guest communication
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <p className="font-medium">Connect Hospitable</p>
                <p className="text-sm text-gray-600">
                  Go to <span className="font-medium">Settings</span> to connect your Hospitable account for automated syncing
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
                4
              </div>
              <div>
                <p className="font-medium">Test AI Responses</p>
                <p className="text-sm text-gray-600">
                  Use <span className="font-medium">AI Chat</span> to test how the AI handles guest questions
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}








