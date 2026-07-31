"use client";

import { Building2, LoaderCircle, Save, Trash2, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAppContext } from "@/components/app-context";
import { Field, PageContainer, PageHeader } from "@/components/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ApiClientError, apiFetch } from "@/lib/api/client";
import { updateOrganizationSchema } from "@/schemas/organization.schema";
import { updateMyProfileSchema } from "@/schemas/profile.schema";

export default function SettingsClient() {
  const router = useRouter();
  const { profile, organization, isSuperAdmin } = useAppContext();
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [orgName, setOrgName] = useState(organization.name);
  const [orgSlug, setOrgSlug] = useState(organization.slug);
  const [busy, setBusy] = useState<string | null>(null);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [orgMessage, setOrgMessage] = useState<string | null>(null);

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    setProfileMessage(null);

    const parsed = updateMyProfileSchema.safeParse({
      full_name: fullName.trim() || null,
      avatar_url: avatarUrl.trim() || null,
    });
    if (!parsed.success) {
      setProfileMessage(parsed.error.issues[0]?.message ?? "Check your profile details.");
      return;
    }

    setBusy("profile");
    try {
      await apiFetch("/api/profiles/me", {
        method: "PATCH",
        body: JSON.stringify(parsed.data),
      });
      setProfileMessage("Profile updated.");
      router.refresh();
    } catch (reason) {
      setProfileMessage(reason instanceof ApiClientError ? reason.message : "Could not update profile.");
    } finally {
      setBusy(null);
    }
  }

  async function saveOrganization(event: React.FormEvent) {
    event.preventDefault();
    setOrgMessage(null);

    const parsed = updateOrganizationSchema.safeParse({ name: orgName, slug: orgSlug });
    if (!parsed.success) {
      setOrgMessage(parsed.error.issues[0]?.message ?? "Check organization details.");
      return;
    }

    setBusy("organization");
    try {
      await apiFetch(`/api/organizations/${organization.id}`, {
        method: "PATCH",
        body: JSON.stringify(parsed.data),
      });
      setOrgMessage("Organization updated.");
      router.refresh();
    } catch (reason) {
      setOrgMessage(
        reason instanceof ApiClientError ? reason.message : "Could not update organization.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function deleteOrganization() {
    const confirmation = window.prompt(
      `Type ${organization.slug} to permanently delete this organization and detach all members.`,
    );
    if (confirmation !== organization.slug) return;

    setBusy("delete");
    try {
      await apiFetch(`/api/organizations/${organization.id}`, { method: "DELETE" });
      router.replace("/onboarding");
      router.refresh();
    } catch (reason) {
      setOrgMessage(
        reason instanceof ApiClientError ? reason.message : "Could not delete organization.",
      );
    } finally {
      setBusy(null);
    }
  }

  const roleLabel =
    profile.role === "super_admin"
      ? "Organization owner"
      : profile.role === "space_admin"
        ? "Space admin"
        : "Member";

  return (
    <PageContainer className="mx-auto max-w-5xl">
      <PageHeader
        title="Settings"
        description="Update your personal profile and, when permitted, your organization details."
      />

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,.8fr)] lg:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="h-5 w-5" style={{ color: "var(--ss-cyan)" }} />
              Profile
            </CardTitle>
            <p className="text-sm" style={{ color: "var(--ss-text-secondary)" }}>
              These details are shown to other members in your organization.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveProfile} className="space-y-5">
              <Field label="Email" hint="Email is managed by Supabase Auth.">
                <Input value={profile.email ?? ""} disabled />
              </Field>
              <Field label="Full name">
                <Input value={fullName} onChange={(event) => setFullName(event.target.value)} />
              </Field>
              <Field label="Avatar URL" hint="Optional public image URL.">
                <Input
                  type="url"
                  value={avatarUrl}
                  onChange={(event) => setAvatarUrl(event.target.value)}
                  placeholder="https://…"
                />
              </Field>

              <div className="app-data-row flex items-center justify-between gap-3 p-3.5">
                <span className="text-sm" style={{ color: "var(--ss-text-secondary)" }}>
                  Current role
                </span>
                <Badge>{roleLabel}</Badge>
              </div>

              {profileMessage ? (
                <p
                  className={`rounded-lg border p-3 text-sm ${
                    profileMessage.includes("updated")
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : "border-red-500/30 bg-red-500/10 text-red-300"
                  }`}
                >
                  {profileMessage}
                </p>
              ) : null}

              <Button className="w-full sm:w-auto" disabled={busy === "profile"}>
                {busy === "profile" ? (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save profile
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" style={{ color: "var(--ss-cyan)" }} />
              Organization
            </CardTitle>
            <p className="text-sm" style={{ color: "var(--ss-text-secondary)" }}>
              Workspace identity and ownership settings.
            </p>
          </CardHeader>
          <CardContent>
            {isSuperAdmin ? (
              <form onSubmit={saveOrganization} className="space-y-5">
                <Field label="Name">
                  <Input value={orgName} onChange={(event) => setOrgName(event.target.value)} />
                </Field>
                <Field
                  label="Slug"
                  hint="Used as the unique organization identifier. Lowercase letters, numbers, and hyphens are recommended."
                >
                  <Input value={orgSlug} onChange={(event) => setOrgSlug(event.target.value)} />
                </Field>

                {orgMessage ? (
                  <p
                    className={`rounded-lg border p-3 text-sm ${
                      orgMessage.includes("updated")
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                        : "border-red-500/30 bg-red-500/10 text-red-300"
                    }`}
                  >
                    {orgMessage}
                  </p>
                ) : null}

                <Button className="w-full sm:w-auto" disabled={busy === "organization"}>
                  {busy === "organization" ? (
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save organization
                </Button>
              </form>
            ) : (
              <div className="space-y-3">
                <div className="app-data-row p-4">
                  <p className="font-medium">{organization.name}</p>
                  <p className="mt-1 text-sm" style={{ color: "var(--ss-text-secondary)" }}>
                    /{organization.slug}
                  </p>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "var(--ss-text-secondary)" }}>
                  Only the organization owner can change workspace identity settings.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {isSuperAdmin ? (
        <Card className="border-red-500/30 bg-red-500/[0.035]">
          <CardHeader>
            <CardTitle className="text-red-300">Danger zone</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:items-center sm:justify-between">
            <p className="max-w-2xl text-sm leading-relaxed" style={{ color: "var(--ss-text-secondary)" }}>
              Deleting the organization permanently removes its resources, bookings, access groups,
              and notification records through database cascades.
            </p>
            <Button
              variant="destructive"
              className="w-full shrink-0 sm:w-auto"
              onClick={deleteOrganization}
              disabled={busy === "delete"}
            >
              {busy === "delete" ? (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete organization
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </PageContainer>
  );
}
