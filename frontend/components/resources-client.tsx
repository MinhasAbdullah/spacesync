"use client";

import {
  Building2,
  CalendarPlus,
  CheckCircle2,
  LoaderCircle,
  MapPin,
  Pencil,
  Plus,
  Search,
  Shield,
  Trash2,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useAppContext } from "@/components/app-context";
import { EmptyState, ErrorState, LoadingState } from "@/components/async-state";
import BookingDialog from "@/components/booking-dialog";
import { Field, PageContainer, PageHeader } from "@/components/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import { ApiClientError, apiFetch, toQueryString } from "@/lib/api/client";
import type { AccessGroup, Resource } from "@/lib/api/types";
import { createResourceSchema, updateResourceSchema } from "@/schemas/resource.schema";

type ResourceForm = {
  name: string;
  type: "room" | "desk" | "equipment" | "vehicle" | "court" | "other";
  location: string;
  capacity: string;
  photo_url: string;
  amenities: string;
  requires_approval: boolean;
  buffer_minutes: string;
  access_group_id: string;
  is_active: boolean;
};

const RESOURCE_TYPES = ["room", "desk", "equipment", "vehicle", "court", "other"] as const;

const EMPTY_FORM: ResourceForm = {
  name: "",
  type: "room",
  location: "",
  capacity: "",
  photo_url: "",
  amenities: "",
  requires_approval: false,
  buffer_minutes: "0",
  access_group_id: "none",
  is_active: true,
};

export default function ResourcesClient() {
  const { isAdmin } = useAppContext();
  const [resources, setResources] = useState<Resource[]>([]);
  const [groups, setGroups] = useState<AccessGroup[]>([]);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Resource | null>(null);
  const [form, setForm] = useState<ResourceForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [bookingResource, setBookingResource] = useState<Resource | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    const resourceUrl = `/api/resources${toQueryString({
      limit: 100,
      q: query || undefined,
      type: type === "all" ? undefined : type,
    })}`;

    Promise.all([
      apiFetch<Resource[]>(resourceUrl),
      apiFetch<AccessGroup[]>("/api/access-groups?limit=100").catch(() => ({
        data: [] as AccessGroup[],
      })),
    ])
      .then(([resourceResponse, groupResponse]) => {
        if (!active) return;
        setResources(resourceResponse.data);
        setGroups(groupResponse.data);
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : "Could not load resources.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [query, type, version]);

  const groupName = useMemo(
    () => new Map(groups.map((group) => [group.id, group.name])),
    [groups],
  );

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEdit(resource: Resource) {
    setEditing(resource);
    setForm({
      name: resource.name,
      type: resource.type as ResourceForm["type"],
      location: resource.location ?? "",
      capacity: resource.capacity ? String(resource.capacity) : "",
      photo_url: resource.photo_url ?? "",
      amenities: (resource.amenities ?? []).join(", "),
      requires_approval: Boolean(resource.requires_approval),
      buffer_minutes: String(resource.buffer_minutes ?? 0),
      access_group_id: resource.access_group_id ?? "none",
      is_active: Boolean(resource.is_active),
    });
    setFormError(null);
    setDialogOpen(true);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);

    const payload = {
      name: form.name,
      type: form.type,
      location: form.location.trim() || null,
      capacity: form.capacity ? Number(form.capacity) : null,
      photo_url: form.photo_url.trim() || null,
      amenities: form.amenities
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      requires_approval: form.requires_approval,
      buffer_minutes: Number(form.buffer_minutes || 0),
      access_group_id: form.access_group_id === "none" ? null : form.access_group_id,
      is_active: form.is_active,
    };

    const parsed = (editing ? updateResourceSchema : createResourceSchema).safeParse(payload);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Check the resource details.");
      return;
    }

    setSaving(true);
    try {
      await apiFetch<Resource>(editing ? `/api/resources/${editing.id}` : "/api/resources", {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify(parsed.data),
      });
      setDialogOpen(false);
      setVersion((value) => value + 1);
    } catch (reason) {
      setFormError(reason instanceof ApiClientError ? reason.message : "Could not save resource.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(resource: Resource) {
    if (!window.confirm(`Delete ${resource.name}? Existing bookings will also be removed.`)) {
      return;
    }

    try {
      await apiFetch(`/api/resources/${resource.id}`, { method: "DELETE" });
      setVersion((value) => value + 1);
    } catch (reason) {
      setError(reason instanceof ApiClientError ? reason.message : "Could not delete resource.");
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Resources"
        description="Browse the resources available to you. Administrators can configure capacity, approval rules, buffers, and access groups."
        actions={
          isAdmin ? (
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add resource
            </Button>
          ) : undefined
        }
      />

      <section className="app-panel app-toolbar">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_190px]">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
              style={{ color: "var(--ss-text-muted)" }}
            />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name or location"
              className="pl-9"
            />
          </div>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All resource types</SelectItem>
              {RESOURCE_TYPES.map((value) => (
                <SelectItem key={value} value={value} className="capitalize">
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      {loading ? (
        <LoadingState label="Loading resources…" />
      ) : error ? (
        <ErrorState message={error} onRetry={() => setVersion((value) => value + 1)} />
      ) : resources.length === 0 ? (
        <EmptyState
          title="No resources found"
          description={
            isAdmin
              ? "Add your first room, desk, or equipment item."
              : "Ask an administrator to add or share resources."
          }
        />
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {resources.map((resource) => (
            <Card key={resource.id} className="app-card-hover flex min-w-0 flex-col overflow-hidden">
              <div
                className="relative flex h-40 items-center justify-center overflow-hidden"
                style={{ background: "rgba(255,255,255,.035)" }}
              >
                {resource.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resource.photo_url}
                    alt={resource.name}
                    className="h-full w-full object-cover transition duration-300 hover:scale-[1.02]"
                  />
                ) : (
                  <Building2 className="h-11 w-11" style={{ color: "var(--ss-text-muted)" }} />
                )}
                <Badge
                  className={`absolute right-3 top-3 ${
                    resource.is_active ? "ss-badge-available" : "ss-badge-conflict"
                  }`}
                >
                  {resource.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>

              <CardContent className="flex flex-1 flex-col gap-4 p-5 sm:p-6">
                <div className="min-w-0">
                  <h3 className="truncate text-base font-semibold">{resource.name}</h3>
                  <p
                    className="mt-1.5 flex min-w-0 items-center gap-1.5 text-sm"
                    style={{ color: "var(--ss-text-secondary)" }}
                  >
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{resource.location || "No location"}</span>
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 text-xs" style={{ color: "var(--ss-text-secondary)" }}>
                  <span className="rounded-md border px-2 py-1 capitalize">{resource.type}</span>
                  {resource.capacity ? (
                    <span className="flex items-center gap-1 rounded-md border px-2 py-1">
                      <Users className="h-3 w-3" />
                      {resource.capacity}
                    </span>
                  ) : null}
                  {resource.requires_approval ? (
                    <span className="flex items-center gap-1 rounded-md border px-2 py-1">
                      <Shield className="h-3 w-3" />
                      Approval
                    </span>
                  ) : null}
                  {resource.buffer_minutes ? (
                    <span className="rounded-md border px-2 py-1">
                      {resource.buffer_minutes}m buffer
                    </span>
                  ) : null}
                </div>

                {resource.access_group_id ? (
                  <p className="text-xs" style={{ color: "var(--ss-text-muted)" }}>
                    Access: {groupName.get(resource.access_group_id) ?? "Restricted group"}
                  </p>
                ) : null}

                <div className="mt-auto flex gap-2 pt-1">
                  <Button
                    className="min-w-0 flex-1"
                    onClick={() => setBookingResource(resource)}
                    disabled={!resource.is_active}
                  >
                    <CalendarPlus className="mr-2 h-4 w-4" />
                    Book
                  </Button>
                  {isAdmin ? (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openEdit(resource)}
                        aria-label={`Edit ${resource.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => remove(resource)}
                        aria-label={`Delete ${resource.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit resource" : "Add resource"}</DialogTitle>
            <DialogDescription>
              Configure the details used for discovery, access control, and booking validation.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={save} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name">
                <Input
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  required
                />
              </Field>
              <Field label="Type">
                <Select
                  value={form.type}
                  onValueChange={(value: ResourceForm["type"]) => setForm({ ...form, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESOURCE_TYPES.map((value) => (
                      <SelectItem key={value} value={value} className="capitalize">
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Location">
                <Input
                  value={form.location}
                  onChange={(event) => setForm({ ...form, location: event.target.value })}
                  placeholder="Building A, second floor"
                />
              </Field>
              <Field label="Capacity">
                <Input
                  type="number"
                  min={1}
                  value={form.capacity}
                  onChange={(event) => setForm({ ...form, capacity: event.target.value })}
                />
              </Field>
            </div>

            <Field label="Photo URL" hint="Optional public URL for a resource image.">
              <Input
                type="url"
                value={form.photo_url}
                onChange={(event) => setForm({ ...form, photo_url: event.target.value })}
                placeholder="https://…"
              />
            </Field>

            <Field label="Amenities" hint="Separate amenities with commas.">
              <Input
                value={form.amenities}
                onChange={(event) => setForm({ ...form, amenities: event.target.value })}
                placeholder="Projector, whiteboard, wheelchair accessible"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Buffer minutes">
                <Input
                  type="number"
                  min={0}
                  max={1440}
                  value={form.buffer_minutes}
                  onChange={(event) => setForm({ ...form, buffer_minutes: event.target.value })}
                />
              </Field>
              <Field label="Access group">
                <Select
                  value={form.access_group_id}
                  onValueChange={(value) => setForm({ ...form, access_group_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Open to organization</SelectItem>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="app-data-row flex items-center justify-between gap-4 p-3.5">
                <span>
                  <span className="block text-sm font-medium">Requires approval</span>
                  <span className="mt-0.5 block text-xs" style={{ color: "var(--ss-text-muted)" }}>
                    New bookings start as pending.
                  </span>
                </span>
                <Switch
                  checked={form.requires_approval}
                  onCheckedChange={(value) => setForm({ ...form, requires_approval: value })}
                />
              </label>
              <label className="app-data-row flex items-center justify-between gap-4 p-3.5">
                <span>
                  <span className="block text-sm font-medium">Active</span>
                  <span className="mt-0.5 block text-xs" style={{ color: "var(--ss-text-muted)" }}>
                    Inactive resources cannot be booked.
                  </span>
                </span>
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(value) => setForm({ ...form, is_active: value })}
                />
              </label>
            </div>

            {formError ? (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                {formError}
              </p>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button disabled={saving}>
                {saving ? (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                {editing ? "Save changes" : "Create resource"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <BookingDialog
        resource={bookingResource}
        open={Boolean(bookingResource)}
        onOpenChange={(open) => {
          if (!open) setBookingResource(null);
        }}
        onCreated={() => setVersion((value) => value + 1)}
      />
    </PageContainer>
  );
}
