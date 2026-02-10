'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Send, Database, MessageSquare, CheckCircle2, AlertCircle } from 'lucide-react';
import apiClient from '@/lib/api-client';

interface Property {
  id: string;
  name: string;
  address: string;
  propertySheet?: {
    identityData?: {
      propertyName?: string;
    };
  };
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  confidence?: number;
  sources?: string[];
  timestamp: Date;
}

export default function AIChatPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);
  const [isIndexed, setIsIndexed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load properties on mount
  useEffect(() => {
    loadProperties();
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadProperties = async () => {
    try {
      const response = await apiClient.get('/properties');
      setProperties(response.data);
    } catch (error) {
      console.error('Failed to load properties:', error);
    }
  };

  const handleIndexProperty = async () => {
    if (!selectedProperty) return;

    setIsIndexing(true);
    try {
      await apiClient.post(`/ai/properties/${selectedProperty}/index`);
      setIsIndexed(true);
      setMessages([
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: '✅ Property data has been indexed successfully! You can now ask me questions about this property.',
          timestamp: new Date(),
        },
      ]);
    } catch (error: any) {
      console.error('Failed to index property:', error);
      setMessages([
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: `❌ Failed to index property: ${error.response?.data?.message || error.message}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsIndexing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedProperty || !isIndexed) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await apiClient.post(`/ai/properties/${selectedProperty}/query`, {
        question: inputMessage,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.answer,
        confidence: response.data.confidence,
        sources: response.data.sources,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Failed to get AI response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ Failed to get response: ${error.response?.data?.message || error.message}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const getConfidenceBadge = (confidence?: number) => {
    if (!confidence) return null;

    let variant: 'default' | 'secondary' | 'destructive' = 'default';
    let label = '';

    if (confidence >= 95) {
      variant = 'default';
      label = 'Very High Confidence';
    } else if (confidence >= 80) {
      variant = 'secondary';
      label = 'High Confidence';
    } else {
      variant = 'destructive';
      label = 'Low Confidence';
    }

    return (
      <Badge variant={variant} className="ml-2">
        {label} ({confidence}%)
      </Badge>
    );
  };

  const handlePropertyChange = (value: string) => {
    setSelectedProperty(value);
    setIsIndexed(false);
    setMessages([]);
  };

  // Suggested questions
  const suggestedQuestions = [
    "What's the WiFi password?",
    "How do I check in?",
    "What are the house rules?",
    "Where can I park?",
    "What amenities are available?",
    "Are pets allowed?",
    "What's the checkout time?",
    "How do I access the building?",
  ];

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">🤖 AI Property Assistant</h1>
        <p className="text-gray-600">
          Test the AI's knowledge about your properties. Select a property, index it, and start asking questions!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Control Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Property Selection</CardTitle>
            <CardDescription>Choose a property to chat about</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Property</label>
              <Select value={selectedProperty} onValueChange={handlePropertyChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a property..." />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property?.propertySheet?.identityData?.propertyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedProperty && (
              <div className="space-y-3">
                <Button
                  onClick={handleIndexProperty}
                  disabled={isIndexing || isIndexed}
                  className="w-full"
                  variant={isIndexed ? 'secondary' : 'default'}
                >
                  {isIndexing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Indexing...
                    </>
                  ) : isIndexed ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Indexed
                    </>
                  ) : (
                    <>
                      <Database className="mr-2 h-4 w-4" />
                      Index Property
                    </>
                  )}
                </Button>

                {isIndexed && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                      ✅ Ready to chat!
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-300 mt-1">
                      The AI has been trained on this property's data.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Suggested Questions */}
            {isIndexed && (
              <div className="space-y-2 pt-4 border-t">
                <label className="text-sm font-medium">Suggested Questions</label>
                <div className="space-y-2">
                  {suggestedQuestions.map((question, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInputMessage(question)}
                      className="w-full text-left text-sm p-2 rounded-md hover:bg-accent transition-colors"
                    >
                      💬 {question}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat Interface */}
        <Card className="lg:col-span-2 flex flex-col h-[calc(100vh-200px)]">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="mr-2 h-5 w-5" />
              Chat
            </CardTitle>
            <CardDescription>
              {isIndexed
                ? 'Ask me anything about this property!'
                : 'Index a property to start chatting'}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col overflow-hidden">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
              {messages.length === 0 && !isIndexed && (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center space-y-2">
                    <AlertCircle className="mx-auto h-12 w-12 opacity-50" />
                    <p>Select and index a property to start chatting</p>
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-xs font-semibold opacity-70">
                        {message.role === 'user' ? 'You' : '🤖 AI Assistant'}
                      </span>
                      {message.confidence !== undefined && getConfidenceBadge(message.confidence)}
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border/50">
                        <p className="text-xs opacity-70">
                          Sources: {message.sources.join(', ')}
                        </p>
                      </div>
                    )}
                    <p className="text-xs opacity-50 mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={
                  isIndexed
                    ? 'Ask a question about this property...'
                    : 'Index a property first...'
                }
                disabled={!isIndexed || isLoading}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!isIndexed || isLoading || !inputMessage.trim()}
                size="icon"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

