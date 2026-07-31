import AnalyticsClient from "@/components/analytics-client";
import { requirePageOrganization } from "@/lib/auth/page";
export default async function AnalyticsPage() { await requirePageOrganization(["super_admin", "space_admin"]); return <AnalyticsClient />; }
