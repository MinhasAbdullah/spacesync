import Link from "next/link";

import { ApiConsole } from "@/app/api-test/api-console";
import { LogoutButton } from "@/components/logout-button";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ApiTestPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <main className="console-page">
      <header className="console-header">
        <Link className="console-brand" href="/"><span className="console-brand-mark">S</span><span>SpaceSync</span></Link>
        <div className="console-header-user"><span>{user?.email}</span><LogoutButton /></div>
      </header>
      <section className="console-intro">
        <div><p className="console-eyebrow">Authenticated developer workspace</p><h1>Live API console</h1><p className="console-muted">Create real records, bind their IDs into every endpoint, and inspect the exact HTTP response.</p></div>
      </section>
      <ApiConsole />
    </main>
  );
}
