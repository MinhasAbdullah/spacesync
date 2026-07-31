"use client";

import { Building2, LoaderCircle, LogOut, RefreshCw, ShieldCheck, UserPlus, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Field } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import { createOrganizationSchema } from "@/schemas/organization.schema";

export default function OnboardingForm({
  profileName,
  profileEmail,
}: {
  profileName: string;
  profileEmail: string;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suggestedSlug = useMemo(
    () =>
      name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
    [name],
  );
  const visibleSlug = slugTouched ? slug : suggestedSlug;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const parsed = createOrganizationSchema.safeParse({ name, slug: visibleSlug });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the organization details.");
      return;
    }

    setLoading(true);
    try {
      await apiFetch("/api/organizations", {
        method: "POST",
        body: JSON.stringify(parsed.data),
      });
      router.replace("/dashboard");
      router.refresh();
    } catch (reason) {
      setError(
        reason instanceof ApiClientError ? reason.message : "Could not create the organization.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function checkMembership() {
    setChecking(true);
    setError(null);
    try {
      const response = await apiFetch<{ profile: { org_id: string | null } | null }>("/api/auth/session");
      if (response.data.profile?.org_id) {
        router.replace("/dashboard");
      }
      router.refresh();
    } catch (reason) {
      setError(reason instanceof ApiClientError ? reason.message : "Could not refresh membership.");
    } finally {
      setChecking(false);
    }
  }

  async function logout() {
    await apiFetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <main
      className="min-h-screen px-4 py-8 sm:px-6 sm:py-12"
      style={{ background: "var(--ss-bg-base)" }}
    >
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ background: "var(--ss-cyan-dim)", border: "1px solid var(--ss-cyan)" }}
            >
              <Zap className="h-5 w-5" style={{ color: "var(--ss-cyan)" }} />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold sm:text-2xl">Set up your workspace</h1>
              <p className="truncate text-sm" style={{ color: "var(--ss-text-secondary)" }}>
                Welcome{profileName ? `, ${profileName}` : ""}.
              </p>
            </div>
          </div>
          <Button variant="ghost" onClick={logout} className="shrink-0">
            <LogOut className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,.85fr)]">
          <section className="app-panel p-5 sm:p-7">
            <div className="mb-6 flex items-start gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: "var(--ss-cyan-dim)" }}
              >
                <Building2 className="h-5 w-5" style={{ color: "var(--ss-cyan)" }} />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Create a new organization</h2>
                <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--ss-text-secondary)" }}>
                  The person who creates a workspace becomes its organization owner so they can add
                  members, configure resources, and manage roles.
                </p>
              </div>
            </div>

            <form onSubmit={submit} className="space-y-5">
              <Field label="Organization name">
                <div className="relative">
                  <Building2
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                    style={{ color: "var(--ss-text-muted)" }}
                  />
                  <Input
                    className="pl-10"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Zeppelin Labs"
                    required
                  />
                </div>
              </Field>

              <Field
                label="Workspace slug"
                hint="Use lowercase letters, numbers, and hyphens. This value must be unique."
              >
                <Input
                  value={visibleSlug}
                  onChange={(event) => {
                    setSlugTouched(true);
                    setSlug(event.target.value);
                  }}
                  placeholder="zeppelin-labs"
                  required
                />
              </Field>

              <div className="app-data-row flex items-start gap-3 p-3.5">
                <ShieldCheck
                  className="mt-0.5 h-4 w-4 shrink-0"
                  style={{ color: "var(--ss-cyan)" }}
                />
                <p className="text-xs leading-relaxed" style={{ color: "var(--ss-text-secondary)" }}>
                  Your authentication profile remains a regular member until this organization is
                  created. Creating it grants the owner role only for this new workspace.
                </p>
              </div>

              {error ? (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                  {error}
                </p>
              ) : null}

              <Button disabled={loading} className="w-full">
                {loading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create workspace
              </Button>
            </form>
          </section>

          <aside className="app-panel p-5 sm:p-7">
            <div className="flex h-full flex-col">
              <div className="flex items-start gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: "rgba(45, 212, 191, .12)" }}
                >
                  <UserPlus className="h-5 w-5" style={{ color: "var(--ss-teal)" }} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Joining an existing organization?</h2>
                  <p
                    className="mt-1 text-sm leading-relaxed"
                    style={{ color: "var(--ss-text-secondary)" }}
                  >
                    Ask the organization owner to add your already registered email address. You will
                    join as a member unless they explicitly assign the space-admin role.
                  </p>
                </div>
              </div>

              <div className="app-data-row mt-6 p-4">
                <p className="text-xs uppercase tracking-wide" style={{ color: "var(--ss-text-muted)" }}>
                  Registered email
                </p>
                <p className="mt-1 break-all text-sm font-medium">{profileEmail || "Your account email"}</p>
              </div>

              <div className="mt-auto pt-6">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={checkMembership}
                  disabled={checking}
                >
                  {checking ? (
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Check membership again
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
