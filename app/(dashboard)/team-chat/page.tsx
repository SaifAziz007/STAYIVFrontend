'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader2, Send, Plus, Users, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { authApi, type User } from '@/lib/auth';
import { usePageHeader } from '@/components/layout/page-header-context';
import {
  teamChatApi,
  type TeamConversation,
  type TeamMessage,
  type TeamMember,
} from '@/lib/team-chat-api';
import { useTeamChat } from '@/hooks/useTeamChat';

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function conversationLabel(conversation: TeamConversation, currentUserId: string) {
  if (conversation.isGroup) {
    return conversation.name || conversation.participants.map((p) => p.name).join(', ');
  }
  const other = conversation.participants.find((p) => p.id !== currentUserId);
  return other?.name || 'Conversation';
}

function formatTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function TeamChatPage() {
  const [user, setUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<TeamConversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [creatingChat, setCreatingChat] = useState(false);

  const isGroupSelection = selectedMemberIds.length > 1;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedIdRef = useRef<string | null>(null);
  selectedIdRef.current = selectedId;

  useEffect(() => {
    setUser(authApi.getUser());
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      const data = await teamChatApi.listConversations();
      setConversations(data);
    } catch (err) {
      console.error('Failed to load team conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  const handleConversationUpdate = useCallback(
    (update: { conversationId: string; lastMessage: TeamMessage }) => {
      setConversations((prev) => {
        const next = prev.map((c) =>
          c.id === update.conversationId
            ? {
                ...c,
                lastMessage: update.lastMessage,
                updatedAt: update.lastMessage.createdAt,
                unreadCount:
                  selectedIdRef.current === c.id ? c.unreadCount : c.unreadCount + 1,
              }
            : c,
        );
        return [...next].sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        );
      });

      if (update.conversationId === selectedIdRef.current) {
        setMessages((prev) =>
          prev.some((m) => m.id === update.lastMessage.id) ? prev : [...prev, update.lastMessage],
        );
      }
    },
    [],
  );

  const { joinConversation, leaveConversation } = useTeamChat({
    userId: user?.id || '',
    onConversationUpdate: handleConversationUpdate,
  });

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedId) || null,
    [conversations, selectedId],
  );

  const openConversation = useCallback(
    async (id: string) => {
      if (selectedIdRef.current && selectedIdRef.current !== id) {
        leaveConversation(selectedIdRef.current);
      }
      setSelectedId(id);
      setLoadingMessages(true);
      joinConversation(id);
      try {
        const data = await teamChatApi.getMessages(id);
        setMessages(data);
        await teamChatApi.markAsRead(id);
        setConversations((prev) =>
          prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)),
        );
      } catch (err) {
        console.error('Failed to load messages:', err);
      } finally {
        setLoadingMessages(false);
      }
    },
    [joinConversation, leaveConversation],
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(async () => {
    const body = draft.trim();
    if (!body || !selectedId || sending) return;

    setSending(true);
    setDraft('');
    try {
      const message = await teamChatApi.sendMessage(selectedId, body);
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
    } catch (err) {
      console.error('Failed to send message:', err);
      setDraft(body);
    } finally {
      setSending(false);
    }
  }, [draft, selectedId, sending]);

  const openNewChat = useCallback(async () => {
    setNewChatOpen(true);
    setSelectedMemberIds([]);
    setGroupName('');
    try {
      const data = await teamChatApi.listMembers();
      setMembers(data);
    } catch (err) {
      console.error('Failed to load teammates:', err);
    }
  }, []);

  const toggleMember = (id: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    );
  };

  const handleCreateConversation = async () => {
    if (selectedMemberIds.length === 0) return;
    setCreatingChat(true);
    try {
      const conversation = await teamChatApi.startConversation(selectedMemberIds, {
        isGroup: isGroupSelection,
        name: isGroupSelection ? groupName.trim() || undefined : undefined,
      });
      setNewChatOpen(false);
      await loadConversations();
      await openConversation(conversation.id);
    } catch (err) {
      console.error('Failed to start conversation:', err);
    } finally {
      setCreatingChat(false);
    }
  };

  usePageHeader({
    title: 'Team Chat',
    description: 'Message your teammates directly — no more switching to Slack or WhatsApp',
  });

  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-220px)] min-h-[500px]">
        <Card className="md:col-span-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-border flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-foreground">Conversations</h2>
            <Button size="sm" variant="outline" onClick={openNewChat}>
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingConversations ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center text-sm text-gray-500 dark:text-muted-foreground p-6">
                No conversations yet. Start one with your teammates.
              </div>
            ) : (
              conversations.map((conversation) => {
                const label = conversationLabel(conversation, user?.id || '');
                const active = conversation.id === selectedId;
                return (
                  <button
                    key={conversation.id}
                    onClick={() => void openConversation(conversation.id)}
                    className={cn(
                      'w-full text-left px-4 py-3 flex items-start gap-3 border-b border-gray-100 dark:border-border/60 hover:bg-gray-50 dark:hover:bg-muted/40 transition-colors',
                      active && 'bg-blue-50 dark:bg-muted/60',
                    )}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {conversation.isGroup ? <Users className="h-4 w-4" /> : initials(label)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm text-gray-900 dark:text-foreground truncate">
                          {label}
                        </span>
                        {conversation.lastMessage && (
                          <span className="text-xs text-gray-400 dark:text-muted-foreground shrink-0 ml-2">
                            {formatTime(conversation.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-xs text-gray-500 dark:text-muted-foreground truncate">
                          {conversation.lastMessage
                            ? `${conversation.lastMessage.sender?.id === user?.id ? 'You: ' : ''}${conversation.lastMessage.body}`
                            : 'No messages yet'}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <Badge className="ml-2 shrink-0">{conversation.unreadCount}</Badge>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </Card>

        <Card className="md:col-span-2 flex flex-col overflow-hidden">
          {!selectedConversation ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-muted-foreground gap-2">
              <MessageCircle className="h-10 w-10" />
              <p className="text-sm">Select a conversation to start chatting</p>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-gray-200 dark:border-border flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback>
                    {selectedConversation.isGroup ? (
                      <Users className="h-4 w-4" />
                    ) : (
                      initials(conversationLabel(selectedConversation, user?.id || ''))
                    )}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm text-gray-900 dark:text-foreground">
                    {conversationLabel(selectedConversation, user?.id || '')}
                  </p>
                  {selectedConversation.isGroup && (
                    <p className="text-xs text-gray-500 dark:text-muted-foreground">
                      {selectedConversation.participants.map((p) => p.name).join(', ')}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : (
                  messages.map((message) => {
                    const mine = message.senderId === user?.id;
                    return (
                      <div
                        key={message.id}
                        className={cn('flex', mine ? 'justify-end' : 'justify-start')}
                      >
                        <div
                          className={cn(
                            'max-w-[70%] rounded-2xl px-4 py-2 text-sm',
                            mine
                              ? 'bg-blue-600 text-white rounded-br-sm'
                              : 'bg-gray-100 dark:bg-muted text-gray-900 dark:text-foreground rounded-bl-sm',
                          )}
                        >
                          {!mine && selectedConversation.isGroup && (
                            <p className="text-xs font-medium mb-0.5 opacity-70">
                              {message.sender.name}
                            </p>
                          )}
                          <p className="whitespace-pre-wrap break-words">{message.body}</p>
                          <p
                            className={cn(
                              'text-[10px] mt-1 opacity-60',
                              mine ? 'text-right' : 'text-left',
                            )}
                          >
                            {formatTime(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t border-gray-200 dark:border-border flex items-end gap-2">
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void handleSend();
                    }
                  }}
                  placeholder="Type a message…"
                  className="min-h-[44px] max-h-32 resize-none"
                  rows={1}
                />
                <Button onClick={() => void handleSend()} disabled={!draft.trim() || sending}>
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>

      <Dialog open={newChatOpen} onOpenChange={setNewChatOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isGroupSelection ? 'Create a group chat' : 'Start a conversation'}
            </DialogTitle>
          </DialogHeader>

          <p className="text-xs text-gray-500 dark:text-muted-foreground -mt-2">
            Select one teammate for a direct message, or two or more to create a group.
          </p>

          {isGroupSelection && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-900 dark:text-foreground">
                Group name <span className="text-gray-400">(optional)</span>
              </label>
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g. Cleaning Team"
                maxLength={60}
              />
            </div>
          )}

          <div className="max-h-72 overflow-y-auto space-y-1">
            {members.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-muted-foreground py-4 text-center">
                No teammates available yet.
              </p>
            ) : (
              members.map((member) => {
                const checked = selectedMemberIds.includes(member.id);
                return (
                  <button
                    key={member.id}
                    onClick={() => toggleMember(member.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
                      checked
                        ? 'bg-blue-50 dark:bg-muted/60'
                        : 'hover:bg-gray-50 dark:hover:bg-muted/40',
                    )}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{initials(member.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-foreground truncate">
                        {member.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-muted-foreground truncate">
                        {member.email}
                      </p>
                    </div>
                    {checked && <Badge variant="secondary">Selected</Badge>}
                  </button>
                );
              })
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewChatOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleCreateConversation()}
              disabled={selectedMemberIds.length === 0 || creatingChat}
            >
              {creatingChat ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {selectedMemberIds.length > 1 ? 'Start group chat' : 'Start conversation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
