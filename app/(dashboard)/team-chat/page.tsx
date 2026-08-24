'use client';

import { Suspense, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Loader2,
  Send,
  Plus,
  Users,
  MessageCircle,
  Paperclip,
  Bot,
  Settings,
  X,
  AtSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { authApi, type User } from '@/lib/auth';
import { usePageHeader } from '@/components/layout/page-header-context';
import { useToast } from '@/hooks/use-toast';
import {
  teamChatApi,
  ASSISTANT_HANDLE,
  MAX_ATTACHMENT_BYTES,
  type TeamConversation,
  type TeamMessage,
  type TeamMember,
  type TeamAttachment,
} from '@/lib/team-chat-api';
import { useTeamChat } from '@/hooks/useTeamChat';
import MessageBody from '@/components/team-chat/message-body';
import AttachmentPreview from '@/components/team-chat/attachment-preview';
import MentionComposer, {
  type MentionCandidate,
} from '@/components/team-chat/mention-composer';
import GroupSettingsDialog from '@/components/team-chat/group-settings-dialog';

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

function previewOf(message: TeamMessage) {
  if (message.body?.trim()) return message.body;
  return message.attachments.length > 0 ? 'Sent an attachment' : '';
}

function TeamChatPageContent() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<TeamConversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<TeamAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [assistantThinking, setAssistantThinking] = useState(false);
  const [groupSettingsOpen, setGroupSettingsOpen] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [creatingChat, setCreatingChat] = useState(false);

  const isGroupSelection = selectedMemberIds.length > 1;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedIdRef = useRef<string | null>(null);
  selectedIdRef.current = selectedId;

  useEffect(() => {
    setUser(authApi.getUser());
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      const data = await teamChatApi.listConversations();
      setConversations(data);
      return data;
    } catch (err) {
      console.error('Failed to load team conversations:', err);
      return [];
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

  const handleConversationChanged = useCallback(
    (conversationId: string) => {
      // Membership or settings changed — refetch so roles and the member list stay right.
      void loadConversations();
      if (conversationId === selectedIdRef.current) {
        void teamChatApi.getMessages(conversationId).then(setMessages).catch(() => undefined);
      }
    },
    [loadConversations],
  );

  const handleAssistantThinking = useCallback((conversationId: string, thinking: boolean) => {
    if (conversationId === selectedIdRef.current) setAssistantThinking(thinking);
  }, []);

  const { joinConversation, leaveConversation } = useTeamChat({
    userId: user?.id || '',
    onConversationUpdate: handleConversationUpdate,
    onConversationChanged: handleConversationChanged,
    onAssistantThinking: handleAssistantThinking,
  });

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedId) || null,
    [conversations, selectedId],
  );

  const mentionCandidates = useMemo<MentionCandidate[]>(() => {
    if (!selectedConversation) return [];

    const people: MentionCandidate[] = selectedConversation.participants
      .filter((p) => p.id !== user?.id)
      .map((p) => ({ id: p.id, label: p.name, hint: p.email, kind: 'user' }));

    const reserved: MentionCandidate[] = [
      {
        id: 'assistant',
        label: ASSISTANT_HANDLE,
        hint: 'Ask the StayIV AI about your live data',
        kind: 'assistant',
      },
    ];

    if (selectedConversation.isGroup) {
      reserved.push({
        id: 'everyone',
        label: 'everyone',
        hint: 'Notify every member of this group',
        kind: 'everyone',
      });
    }

    return [...reserved, ...people];
  }, [selectedConversation, user?.id]);

  const openConversation = useCallback(
    async (id: string) => {
      if (selectedIdRef.current && selectedIdRef.current !== id) {
        leaveConversation(selectedIdRef.current);
      }
      setSelectedId(id);
      setLoadingMessages(true);
      setAssistantThinking(false);
      setPendingFiles([]);
      joinConversation(id);
      try {
        const data = await teamChatApi.getMessages(id);
        setMessages(data);
        await teamChatApi.markAsRead(id);
        setConversations((prev) =>
          prev.map((c) => (c.id === id ? { ...c, unreadCount: 0, unreadMentionCount: 0 } : c)),
        );
      } catch (err) {
        console.error('Failed to load messages:', err);
      } finally {
        setLoadingMessages(false);
      }
    },
    [joinConversation, leaveConversation],
  );

  // Deep link from a notification: /team-chat?conversation=<id>
  const deepLinkId = searchParams.get('conversation');
  const deepLinkHandled = useRef<string | null>(null);
  useEffect(() => {
    if (!deepLinkId || loadingConversations) return;
    if (deepLinkHandled.current === deepLinkId) return;
    deepLinkHandled.current = deepLinkId;
    void openConversation(deepLinkId);
  }, [deepLinkId, loadingConversations, openConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, assistantThinking]);

  const handleFilesSelected = useCallback(
    async (files: FileList | null) => {
      if (!files?.length || !selectedId) return;

      setUploading(true);
      try {
        for (const file of Array.from(files)) {
          if (file.size > MAX_ATTACHMENT_BYTES) {
            toast({
              title: `${file.name} is too large`,
              description: `Files must be ${Math.round(MAX_ATTACHMENT_BYTES / (1024 * 1024))}MB or smaller.`,
              variant: 'destructive',
            });
            continue;
          }
          const uploaded = await teamChatApi.uploadAttachment(selectedId, file);
          setPendingFiles((prev) => [...prev, uploaded]);
        }
      } catch (error: any) {
        toast({
          title: error?.response?.data?.message || 'Upload failed',
          variant: 'destructive',
        });
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [selectedId, toast],
  );

  const handleSend = useCallback(async () => {
    const body = draft.trim();
    if ((!body && pendingFiles.length === 0) || !selectedId || sending) return;

    const attachmentIds = pendingFiles.map((f) => f.id);
    setSending(true);
    setDraft('');
    setPendingFiles([]);
    try {
      const message = await teamChatApi.sendMessage(selectedId, body, attachmentIds);
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
    } catch (err) {
      console.error('Failed to send message:', err);
      setDraft(body);
      setPendingFiles(pendingFiles);
      toast({ title: 'Message not sent', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  }, [draft, pendingFiles, selectedId, sending, toast]);

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
    description: `Message your teammates, share files, or ask @${ASSISTANT_HANDLE} about your live data`,
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
                            ? `${
                                conversation.lastMessage.authorType === 'assistant'
                                  ? 'StayIV AI: '
                                  : conversation.lastMessage.sender?.id === user?.id
                                    ? 'You: '
                                    : ''
                              }${previewOf(conversation.lastMessage)}`
                            : 'No messages yet'}
                        </p>
                        <span className="flex items-center gap-1 ml-2 shrink-0">
                          {conversation.unreadMentionCount > 0 && (
                            <Badge className="bg-amber-500 hover:bg-amber-500 gap-0.5 px-1.5">
                              <AtSign className="h-3 w-3" />
                              {conversation.unreadMentionCount}
                            </Badge>
                          )}
                          {conversation.unreadCount > 0 && (
                            <Badge>{conversation.unreadCount}</Badge>
                          )}
                        </span>
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
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 dark:text-foreground truncate">
                    {conversationLabel(selectedConversation, user?.id || '')}
                  </p>
                  {selectedConversation.isGroup && (
                    <p className="text-xs text-gray-500 dark:text-muted-foreground truncate">
                      {selectedConversation.participants.map((p) => p.name).join(', ')}
                    </p>
                  )}
                </div>
                {selectedConversation.isGroup && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 shrink-0"
                    onClick={() => setGroupSettingsOpen(true)}
                  >
                    <Settings className="h-4 w-4" />
                    {selectedConversation.myRole === 'admin' ? 'Manage' : 'Members'}
                  </Button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : (
                  messages.map((message) => {
                    const isAssistant = message.authorType === 'assistant';
                    const mine = !isAssistant && message.senderId === user?.id;

                    return (
                      <div
                        key={message.id}
                        className={cn('flex', mine ? 'justify-end' : 'justify-start')}
                      >
                        <div
                          className={cn(
                            'max-w-[70%] rounded-2xl px-4 py-2 text-sm',
                            isAssistant
                              ? 'bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 text-gray-900 dark:text-foreground rounded-bl-sm'
                              : mine
                                ? 'bg-blue-600 text-white rounded-br-sm'
                                : 'bg-gray-100 dark:bg-muted text-gray-900 dark:text-foreground rounded-bl-sm',
                          )}
                        >
                          {isAssistant && (
                            <p className="text-xs font-semibold mb-1 flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300">
                              <Bot className="h-3.5 w-3.5" />
                              StayIV AI
                            </p>
                          )}
                          {!mine && !isAssistant && selectedConversation.isGroup && (
                            <p className="text-xs font-medium mb-0.5 opacity-70">
                              {message.sender?.name ?? 'Teammate'}
                            </p>
                          )}

                          {message.body?.trim() && (
                            <MessageBody
                              body={message.body}
                              mentions={message.mentions}
                              currentUserId={user?.id}
                              inverted={mine}
                            />
                          )}

                          {message.attachments.map((attachment) => (
                            <AttachmentPreview
                              key={attachment.id}
                              attachment={attachment}
                              inverted={mine}
                            />
                          ))}

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

                {assistantThinking && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl rounded-bl-sm px-4 py-2 text-sm bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                      <Bot className="h-3.5 w-3.5" />
                      <span className="text-xs">StayIV AI is looking that up…</span>
                      <Loader2 className="h-3 w-3 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-gray-200 dark:border-border">
                {pendingFiles.length > 0 && (
                  <div className="px-4 pt-3 flex flex-wrap gap-2">
                    {pendingFiles.map((file) => (
                      <span
                        key={file.id}
                        className="flex items-center gap-2 rounded-full bg-gray-100 dark:bg-muted px-3 py-1 text-xs text-gray-700 dark:text-foreground"
                      >
                        <Paperclip className="h-3 w-3" />
                        <span className="max-w-[160px] truncate">{file.fileName}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setPendingFiles((prev) => prev.filter((f) => f.id !== file.id))
                          }
                          aria-label={`Remove ${file.fileName}`}
                        >
                          <X className="h-3 w-3 opacity-60 hover:opacity-100" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="p-4 flex items-end gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(event) => void handleFilesSelected(event.target.files)}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    title="Attach files"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Paperclip className="h-4 w-4" />
                    )}
                  </Button>

                  <MentionComposer
                    value={draft}
                    onChange={setDraft}
                    onSubmit={() => void handleSend()}
                    candidates={mentionCandidates}
                    disabled={sending}
                    placeholder={`Type a message — @ to mention, @${ASSISTANT_HANDLE} to ask AI`}
                  />

                  <Button
                    onClick={() => void handleSend()}
                    disabled={(!draft.trim() && pendingFiles.length === 0) || sending}
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>

      {selectedConversation?.isGroup && user && (
        <GroupSettingsDialog
          open={groupSettingsOpen}
          onOpenChange={setGroupSettingsOpen}
          conversation={selectedConversation}
          currentUserId={user.id}
          onUpdated={() => void loadConversations()}
        />
      )}

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

/**
 * useSearchParams (the ?conversation= deep link from a notification) needs a
 * Suspense boundary or the route cannot be prerendered.
 */
export default function TeamChatPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto p-6 flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      }
    >
      <TeamChatPageContent />
    </Suspense>
  );
}
