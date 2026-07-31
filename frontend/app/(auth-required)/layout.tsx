import { requirePageUser } from "@/lib/auth/page";

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  await requirePageUser();
  return children;
}
