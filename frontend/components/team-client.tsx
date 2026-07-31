"use client";

import {
  LoaderCircle,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useAppContext } from "@/components/app-context";
import { EmptyState, ErrorState, LoadingState } from "@/components/async-state";
import { Field, PageContainer, PageHeader } from "@/components/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiClientError, apiFetch } from "@/lib/api/client";
import type {
  AccessGroup,
  AccessGroupMemberWithProfile,
  AppRole,
  Profile,
} from "@/lib/api/types";
import { createAccessGroupSchema } from "@/schemas/access-group.schema";
import { addOrganizationMemberSchema } from "@/schemas/organization.schema";

function roleLabel(role: string | null) {
  if (role === "super_admin") return "Organization owner";
  if (role === "space_admin") return "Space admin";
  return "Member";
}

export default function TeamClient() {
  const { organization, profile, isSuperAdmin } = useAppContext();
  const [members, setMembers] = useState<Profile[]>([]);
  const [groups, setGroups] = useState<AccessGroup[]>([]);
  const [groupMembers, setGroupMembers] = useState<
    Record<string, AccessGroupMemberWithProfile[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AppRole>("member");
  const [groupOpen, setGroupOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [dialogError, setDialogError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([
      apiFetch<Profile[]>(`/api/organizations/${organization.id}/members`),
      apiFetch<AccessGroup[]>("/api/access-groups?limit=100"),
    ])
      .then(async ([memberResponse, groupResponse]) => {
        if (!active) return;
        setMembers(memberResponse.data);
        setGroups(groupResponse.data);

        const membershipResponses = await Promise.all(
          groupResponse.data.map(async (group) => {
            try {
              const response = await apiFetch<AccessGroupMemberWithProfile[]>(
                `/api/access-groups/${group.id}/members`,
              );
              return [group.id, response.data] as const;
            } catch {
              return [group.id, [] as AccessGroupMemberWithProfile[]] as const;
            }
          }),
        );

        if (active) setGroupMembers(Object.fromEntries(membershipResponses));
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : "Could not load team settings.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [organization.id, version]);

  async function invite(event: React.FormEvent) {
    event.preventDefault();
    setDialogError(null);

    const parsed = addOrganizationMemberSchema.safeParse({
      email: inviteEmail,
      role: inviteRole,
    });
    if (!parsed.success) {
      setDialogError(parsed.error.issues[0]?.message ?? "Check the member details.");
      return;
    }

    setBusy("invite");
    try {
      await apiFetch(`/api/organizations/${organization.id}/members`, {
        method: "POST",
        body: JSON.stringify(parsed.data),
      });
      setInviteOpen(false);
      setInviteEmail("");
      setInviteRole("member");
      setVersion((value) => value + 1);
    } catch (reason) {
      setDialogError(reason instanceof ApiClientError ? reason.message : "Could not add member.");
    } finally {
      setBusy(null);
    }
  }

  async function changeRole(member: Profile, role: AppRole) {
    setBusy(member.id);
    setError(null);
    try {
      await apiFetch(`/api/profiles/${member.id}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      });
      setVersion((value) => value + 1);
    } catch (reason) {
      setError(reason instanceof ApiClientError ? reason.message : "Could not update role.");
    } finally {
      setBusy(null);
    }
  }

  async function removeMember(member: Profile) {
    if (!window.confirm(`Remove ${member.full_name || member.email} from the organization?`)) {
      return;
    }

    setBusy(member.id);
    try {
      await apiFetch(`/api/organizations/${organization.id}/members/${member.id}`, {
        method: "DELETE",
      });
      setVersion((value) => value + 1);
    } catch (reason) {
      setError(reason instanceof ApiClientError ? reason.message : "Could not remove member.");
    } finally {
      setBusy(null);
    }
  }

  async function createGroup(event: React.FormEvent) {
    event.preventDefault();
    setDialogError(null);

    const parsed = createAccessGroupSchema.safeParse({ name: groupName });
    if (!parsed.success) {
      setDialogError(parsed.error.issues[0]?.message ?? "Check the group name.");
      return;
    }

    setBusy("group");
    try {
      await apiFetch("/api/access-groups", {
        method: "POST",
        body: JSON.stringify(parsed.data),
      });
      setGroupOpen(false);
      setGroupName("");
      setVersion((value) => value + 1);
    } catch (reason) {
      setDialogError(
        reason instanceof ApiClientError ? reason.message : "Could not create access group.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function addToGroup(group: AccessGroup, userId: string) {
    setBusy(`${group.id}:${userId}`);
    try {
      await apiFetch(`/api/access-groups/${group.id}/members`, {
        method: "POST",
        body: JSON.stringify({ user_id: userId }),
      });
      setVersion((value) => value + 1);
    } catch (reason) {
      setError(reason instanceof ApiClientError ? reason.message : "Could not add group member.");
    } finally {
      setBusy(null);
    }
  }

  async function removeFromGroup(groupId: string, userId: string) {
    setBusy(`${groupId}:${userId}`);
    try {
      await apiFetch(`/api/access-groups/${groupId}/members/${userId}`, {
        method: "DELETE",
      });
      setVersion((value) => value + 1);
    } catch (reason) {
      setError(reason instanceof ApiClientError ? reason.message : "Could not remove group member.");
    } finally {
      setBusy(null);
    }
  }

  async function deleteGroup(group: AccessGroup) {
    if (!window.confirm(`Delete access group ${group.name}? Resources assigned to it may need updating.`)) {
      return;
    }

    setBusy(group.id);
    try {
      await apiFetch(`/api/access-groups/${group.id}`, { method: "DELETE" });
      setVersion((value) => value + 1);
    } catch (reason) {
      setError(reason instanceof ApiClientError ? reason.message : "Could not delete access group.");
    } finally {
      setBusy(null);
    }
  }

  const memberById = useMemo(
    () => new Map(members.map((member) => [member.id, member])),
    [members],
  );

  if (loading) return <LoadingState label="Loading organization access…" />;
  if (error && members.length === 0) {
    return <ErrorState message={error} onRetry={() => setVersion((value) => value + 1)} />;
  }

  return (
    <PageContainer>
      <PageHeader
        title="Team and access"
        description="Manage organization members, least-privilege roles, and resource visibility groups."
        actions={
          <Button variant="outline" onClick={() => setVersion((value) => value + 1)}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        }
      />

      {error ? <ErrorState message={error} /> : null}

      <Tabs defaultValue="members" className="min-w-0">
        <div className="app-mobile-scroll">
          <TabsList className="min-w-max">
            <TabsTrigger value="members">
              <Users className="mr-2 h-4 w-4" />
              Members
            </TabsTrigger>
            <TabsTrigger value="groups">
              <Shield className="mr-2 h-4 w-4" />
              Access groups
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="members" className="mt-4 sm:mt-5">
          <Card>
            <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Organization members</CardTitle>
                <p className="mt-1 text-sm" style={{ color: "var(--ss-text-secondary)" }}>
                  New users are added as members or space admins. Organization ownership is not
                  granted from this screen.
                </p>
              </div>
              {isSuperAdmin ? (
                <Button
                  className="w-full sm:w-auto"
                  onClick={() => {
                    setDialogError(null);
                    setInviteOpen(true);
                  }}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add signed-up user
                </Button>
              ) : null}
            </CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <EmptyState
                  title="No members"
                  description="Add users after they create a SpaceSync account."
                />
              ) : (
                <div className="space-y-3">
                  {members.map((member) => {
                    const isOwner = member.role === "super_admin";
                    const isCurrentUser = member.id === profile.id;

                    return (
                      <div
                        key={member.id}
                        className="app-data-row flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {member.full_name || "Unnamed user"}
                            {isCurrentUser ? (
                              <span className="ml-2 text-xs" style={{ color: "var(--ss-cyan)" }}>
                                (you)
                              </span>
                            ) : null}
                          </p>
                          <p
                            className="mt-1 truncate text-sm"
                            style={{ color: "var(--ss-text-secondary)" }}
                          >
                            {member.email}
                          </p>
                        </div>

                        <div className="flex w-full items-center gap-2 sm:w-auto">
                          {isSuperAdmin && !isCurrentUser && !isOwner ? (
                            <Select
                              value={member.role ?? "member"}
                              onValueChange={(value: AppRole) => changeRole(member, value)}
                              disabled={busy === member.id}
                            >
                              <SelectTrigger className="min-w-0 flex-1 sm:w-44">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="member">Member</SelectItem>
                                <SelectItem value="space_admin">Space admin</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge className="capitalize">{roleLabel(member.role)}</Badge>
                          )}

                          {isSuperAdmin && !isCurrentUser && !isOwner ? (
                            <Button
                              size="icon"
                              variant="outline"
                              className="shrink-0"
                              onClick={() => removeMember(member)}
                              disabled={busy === member.id}
                              aria-label={`Remove ${member.full_name || member.email}`}
                            >
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="groups" className="mt-4 sm:mt-5">
          <div className="mb-4 flex justify-stretch sm:justify-end">
            <Button
              className="w-full sm:w-auto"
              onClick={() => {
                setDialogError(null);
                setGroupOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              New access group
            </Button>
          </div>

          {groups.length === 0 ? (
            <EmptyState
              title="No access groups"
              description="Create groups such as Engineering or Faculty, then assign them to resources."
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {groups.map((group) => {
                const assigned = groupMembers[group.id] ?? [];
                const assignedIds = new Set(assigned.map((item) => item.user_id));
                const availableMembers = members.filter((member) => !assignedIds.has(member.id));

                return (
                  <Card key={group.id} className="app-card-hover min-w-0">
                    <CardHeader className="flex-row items-start justify-between gap-3">
                      <div className="min-w-0">
                        <CardTitle className="truncate">{group.name}</CardTitle>
                        <p className="mt-1 text-xs" style={{ color: "var(--ss-text-muted)" }}>
                          {assigned.length} {assigned.length === 1 ? "member" : "members"}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="outline"
                        className="shrink-0"
                        onClick={() => deleteGroup(group)}
                        disabled={busy === group.id}
                        aria-label={`Delete ${group.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Select
                        onValueChange={(userId) => addToGroup(group, userId)}
                        disabled={availableMembers.length === 0}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={availableMembers.length ? "Add member" : "All members assigned"}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {availableMembers.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.full_name || member.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div className="space-y-2">
                        {assigned.length === 0 ? (
                          <p
                            className="py-5 text-center text-sm"
                            style={{ color: "var(--ss-text-muted)" }}
                          >
                            No members assigned.
                          </p>
                        ) : (
                          assigned.map((membership) => {
                            const member =
                              membership.profiles ?? memberById.get(membership.user_id ?? "");

                            return (
                              <div
                                key={membership.id}
                                className="app-data-row flex items-center justify-between gap-3 px-3 py-2.5"
                              >
                                <div className="min-w-0">
                                  <p className="truncate text-sm">
                                    {member?.full_name || member?.email || membership.user_id}
                                  </p>
                                  <p
                                    className="truncate text-xs"
                                    style={{ color: "var(--ss-text-muted)" }}
                                  >
                                    {member?.email}
                                  </p>
                                </div>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="shrink-0"
                                  onClick={() =>
                                    membership.user_id &&
                                    removeFromGroup(group.id, membership.user_id)
                                  }
                                  disabled={busy === `${group.id}:${membership.user_id}`}
                                  aria-label="Remove from group"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add organization member</DialogTitle>
            <DialogDescription>
              The user must already have signed up with this exact email address. New members are
              never made organization owners automatically.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={invite} className="space-y-5">
            <Field label="Email">
              <Input
                type="email"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                placeholder="name@company.com"
                required
              />
            </Field>
            <Field label="Role" hint="Use member unless this person manages spaces and approvals.">
              <Select
                value={inviteRole}
                onValueChange={(value: AppRole) => setInviteRole(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="space_admin">Space admin</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            {dialogError ? (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                {dialogError}
              </p>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>
                Cancel
              </Button>
              <Button disabled={busy === "invite"}>
                {busy === "invite" ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
                Add member
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={groupOpen} onOpenChange={setGroupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create access group</DialogTitle>
            <DialogDescription>
              Assign this group to restricted resources from the Resources page.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={createGroup} className="space-y-5">
            <Field label="Group name">
              <Input
                value={groupName}
                onChange={(event) => setGroupName(event.target.value)}
                placeholder="Engineering team"
                required
              />
            </Field>

            {dialogError ? (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                {dialogError}
              </p>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setGroupOpen(false)}>
                Cancel
              </Button>
              <Button disabled={busy === "group"}>
                {busy === "group" ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create group
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
