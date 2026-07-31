"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Row = Record<string, unknown> & { id?: string; name?: string; title?: string; full_name?: string; email?: string };
type Snapshot = {
  session: { user: Row | null; profile: Row | null } | null;
  organizations: Row[];
  profiles: Row[];
  groups: Row[];
  resources: Row[];
  bookings: Row[];
  notifications: Row[];
};

type LiveIds = {
  orgId: string;
  profileId: string;
  groupId: string;
  resourceId: string;
  bookingId: string;
  notificationId: string;
};

type EndpointDefinition = {
  label: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: (ids: LiveIds) => string;
  body?: (ids: LiveIds) => unknown;
  destructive?: boolean;
};

function futureIso(minutes: number) {
  const date = new Date(Date.now() + minutes * 60_000);
  date.setUTCSeconds(0, 0);
  return date.toISOString();
}

const endpoints: EndpointDefinition[] = [
  { label: "Health", method: "GET", path: () => "/api/health" },
  { label: "Auth · sign up", method: "POST", path: () => "/api/auth/signup", body: () => ({ full_name: "", email: "", password: "" }) },
  { label: "Auth · log in", method: "POST", path: () => "/api/auth/login", body: () => ({ email: "", password: "" }) },
  { label: "Auth · session", method: "GET", path: () => "/api/auth/session" },
  { label: "Auth · log out", method: "POST", path: () => "/api/auth/logout" },
  { label: "Organizations · list", method: "GET", path: () => "/api/organizations" },
  { label: "Organizations · create", method: "POST", path: () => "/api/organizations", body: () => ({ name: "", slug: "" }) },
  { label: "Organizations · get", method: "GET", path: (ids) => `/api/organizations/${ids.orgId}` },
  { label: "Organizations · update", method: "PATCH", path: (ids) => `/api/organizations/${ids.orgId}`, body: () => ({ name: "" }) },
  { label: "Organizations · delete", method: "DELETE", path: (ids) => `/api/organizations/${ids.orgId}`, destructive: true },
  { label: "Organization members · list", method: "GET", path: (ids) => `/api/organizations/${ids.orgId}/members` },
  { label: "Organization members · add by email", method: "POST", path: (ids) => `/api/organizations/${ids.orgId}/members`, body: () => ({ email: "", role: "member" }) },
  { label: "Organization members · remove", method: "DELETE", path: (ids) => `/api/organizations/${ids.orgId}/members/${ids.profileId}`, destructive: true },
  { label: "Profiles · list", method: "GET", path: () => "/api/profiles" },
  { label: "Profiles · me", method: "GET", path: () => "/api/profiles/me" },
  { label: "Profiles · update me", method: "PATCH", path: () => "/api/profiles/me", body: () => ({ full_name: "" }) },
  { label: "Profiles · get", method: "GET", path: (ids) => `/api/profiles/${ids.profileId}` },
  { label: "Profiles · change role", method: "PATCH", path: (ids) => `/api/profiles/${ids.profileId}/role`, body: () => ({ role: "member" }) },
  { label: "Access groups · list", method: "GET", path: () => "/api/access-groups" },
  { label: "Access groups · create", method: "POST", path: () => "/api/access-groups", body: () => ({ name: "" }) },
  { label: "Access groups · get", method: "GET", path: (ids) => `/api/access-groups/${ids.groupId}` },
  { label: "Access groups · update", method: "PATCH", path: (ids) => `/api/access-groups/${ids.groupId}`, body: () => ({ name: "" }) },
  { label: "Access groups · delete", method: "DELETE", path: (ids) => `/api/access-groups/${ids.groupId}`, destructive: true },
  { label: "Group members · list", method: "GET", path: (ids) => `/api/access-groups/${ids.groupId}/members` },
  { label: "Group members · add", method: "POST", path: (ids) => `/api/access-groups/${ids.groupId}/members`, body: (ids) => ({ user_id: ids.profileId }) },
  { label: "Group members · remove", method: "DELETE", path: (ids) => `/api/access-groups/${ids.groupId}/members/${ids.profileId}`, destructive: true },
  { label: "Resources · list", method: "GET", path: () => "/api/resources" },
  { label: "Resources · create", method: "POST", path: () => "/api/resources", body: (ids) => ({ name: "", type: "room", location: null, capacity: 1, photo_url: null, amenities: [], requires_approval: false, buffer_minutes: 0, access_group_id: ids.groupId || null, is_active: true }) },
  { label: "Resources · get", method: "GET", path: (ids) => `/api/resources/${ids.resourceId}` },
  { label: "Resources · update", method: "PATCH", path: (ids) => `/api/resources/${ids.resourceId}`, body: () => ({ name: "" }) },
  { label: "Resources · delete", method: "DELETE", path: (ids) => `/api/resources/${ids.resourceId}`, destructive: true },
  { label: "Resources · availability", method: "GET", path: (ids) => `/api/resources/${ids.resourceId}/availability?from=${encodeURIComponent(futureIso(60))}&to=${encodeURIComponent(futureIso(24 * 60))}&duration_minutes=60` },
  { label: "Bookings · list", method: "GET", path: () => "/api/bookings" },
  { label: "Bookings · create", method: "POST", path: () => "/api/bookings", body: (ids) => ({ resource_id: ids.resourceId, title: "", attendee_count: 1, notes: null, start_time: futureIso(60), end_time: futureIso(120), rrule: null }) },
  { label: "Bookings · recurring", method: "POST", path: () => "/api/bookings/recurring", body: (ids) => ({ resource_id: ids.resourceId, title: "", attendee_count: 1, notes: null, start_time: futureIso(60), end_time: futureIso(120), rrule: "FREQ=WEEKLY;COUNT=4", max_occurrences: 4, horizon_days: 60 }) },
  { label: "Bookings · get", method: "GET", path: (ids) => `/api/bookings/${ids.bookingId}` },
  { label: "Bookings · update", method: "PATCH", path: (ids) => `/api/bookings/${ids.bookingId}`, body: () => ({ title: "" }) },
  { label: "Bookings · cancel", method: "DELETE", path: (ids) => `/api/bookings/${ids.bookingId}`, destructive: true },
  { label: "Bookings · approve", method: "POST", path: (ids) => `/api/bookings/${ids.bookingId}/approve`, body: () => ({ reason: null }) },
  { label: "Bookings · deny", method: "POST", path: (ids) => `/api/bookings/${ids.bookingId}/deny`, body: () => ({ reason: "" }) },
  { label: "Bookings · check in", method: "POST", path: (ids) => `/api/bookings/${ids.bookingId}/check-in` },
  { label: "Bookings · no-show", method: "POST", path: (ids) => `/api/bookings/${ids.bookingId}/no-show` },
  { label: "Notifications · list", method: "GET", path: () => "/api/notifications" },
  { label: "Notifications · get", method: "GET", path: (ids) => `/api/notifications/${ids.notificationId}` },
  { label: "Analytics · utilization", method: "GET", path: () => `/api/analytics/utilization?from=${encodeURIComponent(new Date(Date.now() - 30 * 24 * 60 * 60_000).toISOString())}&to=${encodeURIComponent(new Date().toISOString())}` },
];

async function requestJson(path: string, init?: RequestInit) {
  const response = await fetch(path, { cache: "no-store", ...init });
  const text = await response.text();
  let result: unknown = text;
  try { result = text ? JSON.parse(text) : null; } catch { /* keep text */ }
  return { ok: response.ok, status: response.status, result };
}

function rowsFrom(result: unknown) {
  const value = result as { data?: unknown };
  return Array.isArray(value?.data) ? (value.data as Row[]) : [];
}

export function ApiConsole() {
  const [snapshot, setSnapshot] = useState<Snapshot>({ session: null, organizations: [], profiles: [], groups: [], resources: [], bookings: [], notifications: [] });
  const [ids, setIds] = useState<LiveIds>({ orgId: "", profileId: "", groupId: "", resourceId: "", bookingId: "", notificationId: "" });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [body, setBody] = useState("");
  const [pathOverride, setPathOverride] = useState("");
  const [output, setOutput] = useState("Select an endpoint and run it.");
  const [loading, setLoading] = useState(false);

  const selected = endpoints[selectedIndex];
  const computedPath = useMemo(() => selected.path(ids), [selected, ids]);

  const loadSnapshot = useCallback(async () => {
    const sessionResponse = await requestJson("/api/auth/session");
    const session = (sessionResponse.result as { data?: Snapshot["session"] })?.data ?? null;
    const orgResponse = await requestJson("/api/organizations");
    const organizations = rowsFrom(orgResponse.result);
    let profiles: Row[] = [], groups: Row[] = [], resources: Row[] = [], bookings: Row[] = [], notifications: Row[] = [];
    if (organizations.length > 0) {
      const responses = await Promise.all([
        requestJson("/api/profiles?limit=100"),
        requestJson("/api/access-groups?limit=100"),
        requestJson("/api/resources?limit=100"),
        requestJson("/api/bookings?limit=100"),
        requestJson("/api/notifications?limit=100"),
      ]);
      [profiles, groups, resources, bookings, notifications] = responses.map((response) => rowsFrom(response.result));
    }
    setSnapshot({ session, organizations, profiles, groups, resources, bookings, notifications });
    setIds((current) => ({
      orgId: current.orgId || String(organizations[0]?.id ?? ""),
      profileId: current.profileId || String(profiles[0]?.id ?? session?.profile?.id ?? ""),
      groupId: current.groupId || String(groups[0]?.id ?? ""),
      resourceId: current.resourceId || String(resources[0]?.id ?? ""),
      bookingId: current.bookingId || String(bookings[0]?.id ?? ""),
      notificationId: current.notificationId || String(notifications[0]?.id ?? ""),
    }));
  }, []);

  useEffect(() => { void loadSnapshot(); }, [loadSnapshot]);

  useEffect(() => {
    setPathOverride("");
    setBody(selected.body ? JSON.stringify(selected.body(ids), null, 2) : "");
  }, [selectedIndex, selected, ids]);

  async function runEndpoint() {
    const path = pathOverride || computedPath;
    if (path.includes("//") || path.endsWith("/") || /undefined|null$/.test(path) || /:\w+/.test(path)) {
      setOutput("Choose live records for every required path parameter first.");
      return;
    }
    if (selected.destructive && !window.confirm(`Run destructive request: ${selected.method} ${path}?`)) return;
    setLoading(true);
    try {
      let parsedBody: unknown;
      if (body.trim()) {
        try { parsedBody = JSON.parse(body); }
        catch { setOutput("Request body is not valid JSON."); return; }
      }
      const response = await requestJson(path, {
        method: selected.method,
        headers: parsedBody === undefined ? undefined : { "content-type": "application/json" },
        body: parsedBody === undefined ? undefined : JSON.stringify(parsedBody),
      });
      setOutput(JSON.stringify({ request: { method: selected.method, path, body: parsedBody }, response }, null, 2));
      if (selected.method !== "GET") await loadSnapshot();
    } finally {
      setLoading(false);
    }
  }

  const selectors: Array<{ key: keyof LiveIds; label: string; rows: Row[] }> = [
    { key: "orgId", label: "Organization", rows: snapshot.organizations },
    { key: "profileId", label: "Profile", rows: snapshot.profiles },
    { key: "groupId", label: "Access group", rows: snapshot.groups },
    { key: "resourceId", label: "Resource", rows: snapshot.resources },
    { key: "bookingId", label: "Booking", rows: snapshot.bookings },
    { key: "notificationId", label: "Notification", rows: snapshot.notifications },
  ];

  return (
    <div className="console-grid">
      <section className="console-card live-card">
        <div className="console-section-heading">
          <div><p className="console-eyebrow">Live Supabase data</p><h2>Record selectors</h2></div>
          <button className="console-secondary-button" onClick={() => void loadSnapshot()} type="button">Refresh</button>
        </div>
        <p className="console-muted">Every path parameter below is populated from records returned by the real API. No response is mocked.</p>
        <div className="selector-grid">
          {selectors.map((selector) => (
            <label key={selector.key}>
              {selector.label}
              <select value={ids[selector.key]} onChange={(event) => setIds((current) => ({ ...current, [selector.key]: event.target.value }))}>
                <option value="">No live record</option>
                {selector.rows.map((row) => (
                  <option key={String(row.id)} value={String(row.id)}>
                    {String(row.name ?? row.title ?? row.full_name ?? row.email ?? row.id)}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
        <div className="snapshot-counts">
          <span>{snapshot.organizations.length} orgs</span><span>{snapshot.profiles.length} profiles</span><span>{snapshot.groups.length} groups</span><span>{snapshot.resources.length} resources</span><span>{snapshot.bookings.length} bookings</span>
        </div>
      </section>

      <section className="console-card runner-card">
        <div className="console-section-heading"><div><p className="console-eyebrow">Endpoint runner</p><h2>Test every route</h2></div><span className={`method method-${selected.method.toLowerCase()}`}>{selected.method}</span></div>
        <label>
          Endpoint
          <select value={selectedIndex} onChange={(event) => setSelectedIndex(Number(event.target.value))}>
            {endpoints.map((endpoint, index) => <option key={`${endpoint.method}-${endpoint.label}`} value={index}>{endpoint.method} · {endpoint.label}</option>)}
          </select>
        </label>
        <label>
          Request path
          <input value={pathOverride || computedPath} onChange={(event) => setPathOverride(event.target.value)} />
        </label>
        {selected.body && (
          <label>
            JSON body
            <textarea rows={12} value={body} onChange={(event) => setBody(event.target.value)} />
          </label>
        )}
        <button className="console-primary-button" disabled={loading} onClick={() => void runEndpoint()} type="button">{loading ? "Running…" : "Run live request"}</button>
      </section>

      <section className="console-card response-card">
        <div className="console-section-heading"><div><p className="console-eyebrow">Result</p><h2>Request and response</h2></div></div>
        <pre>{output}</pre>
      </section>
    </div>
  );
}
