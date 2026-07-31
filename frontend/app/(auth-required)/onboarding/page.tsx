import { redirect } from "next/navigation";
import OnboardingForm from "@/components/onboarding-form";
import { getPageProfile } from "@/lib/auth/page";

export default async function OnboardingPage() {
  const { profile } = await getPageProfile();
  if (profile.org_id) redirect("/dashboard");
  return <OnboardingForm profileName={profile.full_name ?? ""} profileEmail={profile.email ?? ""} />;
}
