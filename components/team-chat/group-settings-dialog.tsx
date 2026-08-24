'use client';

import { useEffect, useState } from 'react';
import { Loader2, Shield, ShieldOff, UserMinus, UserPlus, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { teamChatApi, type TeamConversation, type TeamMember } from '@/lib/team-chat-api';

function initials(name: string) {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

interface GroupSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversation: TeamConversation;
  currentUserId: string;
  onUpdated: () => void;
}

export default function GroupSettingsDialog({
  open,
  onOpenChange,
  conversation,
  currentUserId,
  onUpdated,
}: GroupSettingsDialogProps) {
  const { toast } = useToast();
  const [name, setName] = useState(conversation.name ?? '');
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const canManage = conversation.myRole === 'admin';
  const participantIds = new Set(conversation.participants.map((p) => p.id));
  const addable = members.filter((m) => !participantIds.has(m.id));

  useEffect(() => {
    if (!open) return;
    setName(conversation.name ?? '');
    teamChatApi
      .listMembers()
      .then(setMembers)
      .catch((error) => console.error('Failed to load teammates:', error));
  }, [open, conversation.name]);

  const run = async (key: string, action: () => Promise<unknown>, successMessage: string) => {
    setBusy(key);
    try {
      await action();
      onUpdated();
      toast({ title: successMessage });
    } catch (error: any) {
      toast({
        title: error?.response?.data?.message || 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Group settings</DialogTitle>
        </DialogHeader>

        {!canManage && (
          <p className="text-xs text-gray-500 dark:text-muted-foreground -mt-2">
            Only group admins can change the name or manage members.
          </p>
        )}

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-900 dark:text-foreground">
            Group name
          </label>
          <div className="flex gap-2">
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={!canManage}
              maxLength={60}
              placeholder="e.g. Cleaning Team"
            />
            <Button
              variant="outline"
              disabled={
                !canManage || busy === 'rename' || !name.trim() || name === conversation.name
              }
              onClick={() =>
                void run(
                  'rename',
                  () => teamChatApi.renameGroup(conversation.id, name.trim()),
                  'Group renamed',
                )
              }
            >
              {busy === 'rename' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-900 dark:text-foreground">
            Members ({conversation.participants.length})
          </p>
          <div className="max-h-56 overflow-y-auto space-y-1">
            {conversation.participants.map((member) => {
              const isAdmin = member.groupRole === 'admin';
              return (
                <div
                  key={member.id}
                  className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-muted/40"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{initials(member.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-foreground truncate">
                      {member.name}
                      {member.id === currentUserId && (
                        <span className="text-gray-400 font-normal"> (you)</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-muted-foreground truncate">
                      {member.email}
                    </p>
                  </div>
                  {isAdmin && <Badge variant="secondary">Admin</Badge>}
                  {canManage && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        title={isAdmin ? 'Remove admin' : 'Make admin'}
                        disabled={busy === `role-${member.id}`}
                        onClick={() =>
                          void run(
                            `role-${member.id}`,
                            () =>
                              teamChatApi.setMemberRole(
                                conversation.id,
                                member.id,
                                isAdmin ? 'member' : 'admin',
                              ),
                            isAdmin ? 'Admin access removed' : 'Member promoted to admin',
                          )
                        }
                      >
                        {isAdmin ? (
                          <ShieldOff className="h-4 w-4" />
                        ) : (
                          <Shield className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Remove from group"
                        disabled={busy === `remove-${member.id}`}
                        onClick={() =>
                          void run(
                            `remove-${member.id}`,
                            () => teamChatApi.removeMember(conversation.id, member.id),
                            'Member removed',
                          )
                        }
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {canManage && addable.length > 0 && (
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-900 dark:text-foreground">Add teammates</p>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {addable.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  disabled={busy === `add-${member.id}`}
                  onClick={() =>
                    void run(
                      `add-${member.id}`,
                      () => teamChatApi.addMembers(conversation.id, [member.id]),
                      `${member.name} added`,
                    )
                  }
                  className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-muted/40 transition-colors"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{initials(member.name)}</AvatarFallback>
                  </Avatar>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium truncate text-gray-900 dark:text-foreground">
                      {member.name}
                    </span>
                    <span className="block text-xs text-gray-500 dark:text-muted-foreground truncate">
                      {member.email}
                    </span>
                  </span>
                  <UserPlus className="h-4 w-4 text-gray-400" />
                </button>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
