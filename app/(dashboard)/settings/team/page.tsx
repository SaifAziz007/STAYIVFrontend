'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { authApi } from '@/lib/auth';
import { usersApi, type ManagedUser } from '@/lib/users-api';
import { createUserSchema, type CreateUserFormData } from '@/lib/validations/auth.schema';
import type { AppScreenKey } from '@/lib/route-permissions';
import {
  CHAT_SUB_SCREEN_KEYS,
  CHAT_SUB_SCREEN_LABELS,
} from '@/lib/chat-action-permissions';
import { Loader2, Trash2, Users } from 'lucide-react';
import { usePageHeader } from '@/components/layout/page-header-context';

type ScreenRow = { key: AppScreenKey; label: string };

/** Top-level rows (Chats sub-rights are nested under CONVERSATIONS). */
const STANDALONE_SCREENS: ScreenRow[] = [
  { key: 'DASHBOARD', label: 'Dashboard' },
  { key: 'PROPERTIES', label: 'Properties' },
  { key: 'PROPERTY_SHEETS', label: 'Property sheets' },
  { key: 'CONVERSATIONS', label: 'Chats / conversations' },
  { key: 'CLEANING', label: 'Cleaning' },
  { key: 'RESERVATIONS', label: 'Reservations' },
  { key: 'INQUIRIES', label: 'Inquiries' },
  { key: 'REVIEWS', label: 'Reviews' },
  { key: 'AI_KNOWLEDGE_BASE', label: 'AI chat / knowledge base' },
  { key: 'HOSPITABLE_INTEGRATION', label: 'Settings (Hospitable)' },
  { key: 'USER_MANAGEMENT', label: 'Team (user management)' },
];

export default function TeamSettingsPage() {
  const router = useRouter();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [permUser, setPermUser] = useState<ManagedUser | null>(null);
  const [permDraft, setPermDraft] = useState<Record<string, boolean>>({});
  const [savingPerm, setSavingPerm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await usersApi.list();
      setUsers(list);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const u = authApi.getUser();
    if (!u || u.role !== 'ADMIN') {
      router.replace('/dashboard');
      return;
    }
    load();
  }, [router, load]);

  const openPermissions = (u: ManagedUser) => {
    setPermUser(u);
    const draft: Record<string, boolean> = {};
    for (const row of STANDALONE_SCREENS) {
      draft[row.key] = u.permissions?.[row.key] === true;
    }
    for (const key of CHAT_SUB_SCREEN_KEYS) {
      draft[key] = u.permissions?.[key] === true;
    }
    draft.USER_MANAGEMENT = false;
    setPermDraft(draft);
  };

  const setConversations = (checked: boolean) => {
    setPermDraft((d) => {
      const next: Record<string, boolean> = { ...d, CONVERSATIONS: checked };
      if (!checked) {
        for (const key of CHAT_SUB_SCREEN_KEYS) {
          next[key] = false;
        }
      }
      return next;
    });
  };

  const savePermissions = async () => {
    if (!permUser) return;
    setSavingPerm(true);
    try {
      const next = { ...permDraft };
      next.USER_MANAGEMENT = false;
      if (!next.CONVERSATIONS) {
        for (const key of CHAT_SUB_SCREEN_KEYS) {
          next[key] = false;
        }
      }
      await usersApi.updatePermissions(permUser.id, next);
      setPermUser(null);
      await load();
    } finally {
      setSavingPerm(false);
    }
  };

  const onCreate = async (data: CreateUserFormData) => {
    setCreating(true);
    try {
      await usersApi.create(data);
      reset();
      setCreateOpen(false);
      await load();
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (u: ManagedUser) => {
    try {
      await usersApi.setStatus(u.id, !u.isActive);
      await load();
    } catch {
      /* toast optional */
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await usersApi.remove(deleteId);
      setDeleteId(null);
      await load();
    } catch {
      setDeleteId(null);
    }
  };

  const conversationsOn = permDraft.CONVERSATIONS === true;

  const teamHeaderActions = useMemo(
    () => (
      <Button type="button" onClick={() => setCreateOpen(true)}>
        Add user
      </Button>
    ),
    [],
  );

  usePageHeader({
    title: 'Team',
    description: 'Create users and assign which screens they can open.',
    actions: teamHeaderActions,
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 px-4 py-6 md:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Sub-accounts under your organization</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12 text-gray-500 dark:text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-gray-600 dark:text-muted-foreground py-8 text-center">No team members yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-border text-left text-gray-600 dark:text-muted-foreground">
                    <th className="pb-2 pr-4">Name</th>
                    <th className="pb-2 pr-4">Email</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-gray-100 dark:border-border">
                      <td className="py-3 pr-4 font-medium text-foreground">{u.name}</td>
                      <td className="py-3 pr-4 text-gray-700 dark:text-muted-foreground">{u.email}</td>
                      <td className="py-3 pr-4">
                        <label className="inline-flex items-center gap-2 cursor-pointer text-foreground">
                          <input
                            type="checkbox"
                            checked={u.isActive}
                            onChange={() => toggleActive(u)}
                            className="rounded border-gray-300 dark:border-border dark:bg-background"
                          />
                          <span>{u.isActive ? 'Active' : 'Inactive'}</span>
                        </label>
                      </td>
                      <td className="py-3 text-right space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openPermissions(u)}
                        >
                          Permissions
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-red-600 dark:text-red-400 dark:border-red-900/50 dark:hover:bg-red-950/35"
                          onClick={() => setDeleteId(u.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add team member</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="team-name">Name</Label>
              <Input id="team-name" {...register('name')} />
              {errors.name && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-email">Email</Label>
              <Input id="team-email" type="email" {...register('email')} />
              {errors.email && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-password">Password</Label>
              <Input id="team-password" type="password" {...register('password')} />
              {errors.password && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? 'Creating…' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!permUser} onOpenChange={(o) => !o && setPermUser(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Screen access — {permUser?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {STANDALONE_SCREENS.map(({ key, label }) => {
              if (key === 'CONVERSATIONS') {
                return (
                  <div key={key} className="rounded-lg border border-gray-200 dark:border-border overflow-hidden">
                    <label className="flex items-center justify-between gap-4 px-3 py-2 bg-gray-50/80 dark:bg-muted/60">
                      <span className="text-sm font-medium text-gray-900 dark:text-foreground">{label}</span>
                      <input
                        type="checkbox"
                        checked={permDraft.CONVERSATIONS === true}
                        onChange={(e) => setConversations(e.target.checked)}
                        className="rounded border-gray-300 dark:border-border dark:bg-background shrink-0"
                      />
                    </label>
                    <div className="px-3 py-2 space-y-2 border-t border-gray-200 dark:border-border bg-card">
                      <p className="text-xs text-gray-500 dark:text-muted-foreground mb-1">
                        Actions on reservation cards (only if Chats is enabled)
                      </p>
                      {CHAT_SUB_SCREEN_KEYS.map((subKey) => (
                        <label
                          key={subKey}
                          className={`flex items-center justify-between gap-4 rounded-md border border-gray-200 dark:border-border px-3 py-2 pl-4 ${
                            !conversationsOn ? 'opacity-50' : ''
                          }`}
                        >
                          <span className="text-sm text-gray-700 dark:text-muted-foreground">
                            {CHAT_SUB_SCREEN_LABELS[subKey]}
                          </span>
                          <input
                            type="checkbox"
                            disabled={!conversationsOn}
                            checked={permDraft[subKey] === true}
                            onChange={(e) =>
                              setPermDraft((d) => ({
                                ...d,
                                [subKey]: e.target.checked,
                              }))
                            }
                            className="rounded border-gray-300 dark:border-border dark:bg-background shrink-0"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                );
              }

              return (
                <label
                  key={key}
                  className={`flex items-center justify-between gap-4 rounded-lg border border-gray-200 dark:border-border px-3 py-2 ${
                    key === 'USER_MANAGEMENT' ? 'opacity-50' : ''
                  }`}
                >
                  <span className="text-sm text-gray-800 dark:text-foreground">{label}</span>
                  <input
                    type="checkbox"
                    disabled={key === 'USER_MANAGEMENT'}
                    checked={permDraft[key] === true}
                    onChange={(e) =>
                      setPermDraft((d) => ({
                        ...d,
                        [key]: e.target.checked,
                      }))
                    }
                    className="rounded border-gray-300 dark:border-border dark:bg-background shrink-0"
                  />
                </label>
              );
            })}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPermUser(null)}>
              Cancel
            </Button>
            <Button type="button" onClick={savePermissions} disabled={savingPerm}>
              {savingPerm ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete user?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 dark:text-muted-foreground">This cannot be undone.</p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
