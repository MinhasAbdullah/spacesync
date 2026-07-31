import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status: string | null }) {
  const value = status ?? "unknown";
  const className = value === "confirmed"
    ? "ss-badge-available"
    : value === "pending"
      ? "ss-badge-pending"
      : value === "cancelled" || value === "denied" || value === "no_show"
        ? "ss-badge-conflict"
        : "ss-badge-booked";
  return <Badge className={className}>{value.replaceAll("_", " ")}</Badge>;
}
