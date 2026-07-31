"use client";

import { Eye, EyeOff, LoaderCircle, Orbit } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { apiFetch, ApiClientError } from "@/lib/api/client";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, signupSchema } from "@/schemas/auth.schema";

export default function AuthPage({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const payload = mode === "login" ? { email, password } : { email, password, full_name: fullName };
    const parsed = (mode === "login" ? loginSchema : signupSchema).safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check the form.");
      return;
    }

    setLoading(true);
    try {
      const response = await apiFetch<{
        user: unknown;
        session: unknown;
        email_confirmation_required?: boolean;
      }>(`/api/auth/${mode}`, { method: "POST", body: JSON.stringify(parsed.data) });

      if (mode === "signup" && response.data.email_confirmation_required) {
        setMessage("Account created. Check your email to confirm your address, then sign in.");
        return;
      }

      const next = searchParams.get("next");
      router.replace(next?.startsWith("/") ? next : "/dashboard");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof ApiClientError ? reason.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  async function continueWithGoogle() {
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
      });
      if (oauthError) throw oauthError;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Google sign-in failed.");
      setLoading(false);
    }
  }

  return (
    <div className="auth-page-wrapper">
      <div className="main-layout">
        <header className="page-header">
          <div className="z-icon">S</div>
          <h1>{mode === "login" ? "Login" : "Sign up"}</h1>
        </header>
        <main className="content-area">
          <div className="auth-card">
            <div className="logo-container"><Orbit className="orbit-glyph h-8 w-8" /><h2>SpaceSync</h2></div>
            <div className="welcome-text">
              <h3>{mode === "login" ? "Welcome back" : "Create your account"}</h3>
              <p>{mode === "login" ? "Sign in to manage your bookings." : "Start booking shared resources in minutes."}</p>
            </div>

            <form className="login-form" onSubmit={submit}>
              {mode === "signup" && (
                <div className="input-group"><label htmlFor="full-name">Full name</label><input id="full-name" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Alex Morgan" autoComplete="name" required /></div>
              )}
              <div className="input-group"><label htmlFor="email">Email address</label><input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="alex@example.com" autoComplete="email" required /></div>
              <div className="input-group password-group">
                <label htmlFor="password">Password</label>
                <div className="input-with-icon">
                  <input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" autoComplete={mode === "login" ? "current-password" : "new-password"} required />
                  <button type="button" className="password-icon" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
                </div>
              </div>

              {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
              {message && <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">{message}</p>}
              <button type="submit" disabled={loading} className="primary-button">{loading && <LoaderCircle className="mr-2 inline h-4 w-4 animate-spin" />}{mode === "login" ? "Sign in" : "Create account"}</button>
            </form>

            <div className="divider">or</div>
            <button type="button" disabled={loading} onClick={continueWithGoogle} className="google-button">
              <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M19.6 10.23c0-.66-.06-1.3-.17-1.93H10v3.65h5.4c-.23 1.25-.94 2.3-1.99 3.01v2.5h3.22c1.88-1.74 2.97-4.29 2.97-7.23z" fill="#4285F4"/><path d="M10 20c2.7 0 4.96-.89 6.61-2.43l-3.22-2.5c-.89.6-2.03.95-3.39.95-2.6 0-4.81-1.76-5.6-4.13H1.08v2.57C2.73 17.7 6.13 20 10 20z" fill="#34A853"/><path d="M4.4 11.9a6.01 6.01 0 0 1 0-3.8V5.53H1.08C.39 6.87 0 8.38 0 10c0 1.62.39 3.13 1.08 4.47l3.32-2.57z" fill="#FBBC05"/><path d="M10 3.98c1.47 0 2.78.5 3.82 1.5l2.86-2.86C14.96.93 12.7 0 10 0 6.13 0 2.73 2.3.8 5.53l3.32 2.57C4.4 6.27 6.61 3.98 10 3.98z" fill="#EA4335"/></svg>
              Continue with Google
            </button>
            <div className="signup-link">{mode === "login" ? <>New to SpaceSync? <Link href="/signup">Create account</Link></> : <>Already have an account? <Link href="/login">Sign in</Link></>}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
