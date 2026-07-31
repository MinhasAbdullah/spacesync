import TeamClient from "@/components/team-client";
import { requirePageOrganization } from "@/lib/auth/page";
export default async function TeamPage() { await requirePageOrganization(["super_admin", "space_admin"]); return <TeamClient />; }
