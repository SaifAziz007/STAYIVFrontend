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
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-6 shadow-lg">
          <Sparkles className="h-10 w-10 text-white" />
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
        <Card className="group hover:shadow-lg transition-all duration-200 border-blue-100 hover:border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                <Building2 className="h-6 w-6 text-white" />
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

        <Card className="group hover:shadow-lg transition-all duration-200 border-green-100 hover:border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                <MessageSquare className="h-6 w-6 text-white" />
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

        <Card className="group hover:shadow-lg transition-all duration-200 border-purple-100 hover:border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                <Settings className="h-6 w-6 text-white" />
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
      <Card className="border-gray-200">
        <CardContent className="pt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Getting Started
          </h2>
          <div className="space-y-4 text-gray-700">
            <div className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-sm font-semibold shadow-sm">
                1
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">Add Your Properties</p>
                <p className="text-sm text-gray-600">
                  Navigate to <span className="font-medium text-gray-900">Properties</span> to add and manage your vacation rentals
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-sm font-semibold shadow-sm">
                2
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">Fill Property Sheets</p>
                <p className="text-sm text-gray-600">
                  Complete property information to train the AI for better guest communication
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-sm font-semibold shadow-sm">
                3
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">Connect Hospitable</p>
                <p className="text-sm text-gray-600">
                  Go to <span className="font-medium text-gray-900">Settings</span> to connect your Hospitable account for automated syncing
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-sm font-semibold shadow-sm">
                4
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">Test AI Responses</p>
                <p className="text-sm text-gray-600">
                  Use <span className="font-medium text-gray-900">AI Chat</span> to test how the AI handles guest questions
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}








