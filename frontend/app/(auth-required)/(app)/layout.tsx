import AppShell from "@/components/AppShell";
import { requirePageOrganization } from "@/lib/auth/page";

export default async function ApplicationLayout({ children }: { children: React.ReactNode }) {
  const { profile, organization } = await requirePageOrganization();
  return <AppShell profile={profile} organization={organization}>{children}</AppShell>;
}
