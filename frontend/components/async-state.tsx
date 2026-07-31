import { AlertTriangle, Inbox, LoaderCircle } from "lucide-react";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-48 items-center justify-center gap-3 text-sm" style={{ color: "var(--ss-text-secondary)" }}>
      <LoaderCircle className="h-5 w-5 animate-spin" /> {label}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-xl border p-6 text-center" style={{ borderColor: "rgba(239,68,68,.35)", background: "rgba(239,68,68,.08)" }}>
      <AlertTriangle className="mx-auto mb-3 h-6 w-6" style={{ color: "var(--ss-danger)" }} />
      <p className="text-sm" style={{ color: "var(--ss-text-primary)" }}>{message}</p>
      {onRetry && <button className="mt-4 text-sm underline" onClick={onRetry}>Try again</button>}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border p-10 text-center" style={{ borderColor: "var(--ss-border)", background: "var(--ss-bg-surface)" }}>
      <Inbox className="mx-auto mb-3 h-7 w-7" style={{ color: "var(--ss-text-muted)" }} />
      <h3 className="font-semibold" style={{ color: "var(--ss-text-primary)" }}>{title}</h3>
      <p className="mt-1 text-sm" style={{ color: "var(--ss-text-secondary)" }}>{description}</p>
    </div>
  );
}
