"use client";

import { FormEvent, useEffect, useState } from "react";
import "./auth.css";

type User = { email: string };
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [mode, setMode] = useState<"login" | "register">("register");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${apiUrl}/api/auth/me`, { credentials: "include" })
      .then(async (response) => {
        if (response.ok) setUser(await response.json());
      })
      .catch(() => setError("Can't reach the Cashie API. Make sure the backend is running."))
      .finally(() => setLoading(false));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(`${apiUrl}/api/auth/${mode}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail ?? "Could not complete your request.");
      setUser(data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not reach the Cashie API.");
    } finally {
      setSubmitting(false);
    }
  }

  async function signOut() {
    await fetch(`${apiUrl}/api/auth/logout`, { method: "POST", credentials: "include" });
    setUser(null);
    setMode("login");
  }

  if (loading) return <main className="auth-loading">Loading Cashie…</main>;
  if (user) return <><div className="auth-session"><span>Signed in as <strong>{user.email}</strong></span><button onClick={signOut}>Sign out</button></div>{children}</>;

  return (
    <main className="auth-screen">
      <section className="auth-card">
        <a className="auth-brand" href="#">Cashie</a>
        <p className="auth-kicker">YOUR MARKET DASHBOARD</p>
        <h1>{mode === "register" ? "Create your account" : "Welcome back"}</h1>
        <p className="auth-description">{mode === "register" ? "Register to access your read-only market dashboard." : "Sign in to continue to your dashboard."}</p>
        <form onSubmit={submit}>
          <label htmlFor="auth-email">Email</label>
          <input id="auth-email" name="email" type="email" autoComplete="email" maxLength={254} required />
          <label htmlFor="auth-password">Password</label>
          <input id="auth-password" name="password" type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} minLength={10} maxLength={128} required />
          {mode === "register" && <small className="auth-hint">Use at least 10 characters.</small>}
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="auth-submit" type="submit" disabled={submitting}>{submitting ? "Please wait…" : mode === "register" ? "Create account" : "Sign in"}</button>
        </form>
        <p className="auth-switch">{mode === "register" ? "Already registered?" : "New to Cashie?"}{" "}<button onClick={() => { setError(""); setMode(mode === "register" ? "login" : "register"); }}>{mode === "register" ? "Sign in" : "Create an account"}</button></p>
        <p className="auth-note">Prices are illustrative sample data, not live quotes. Cashie does not offer trading or brokerage services.</p>
      </section>
    </main>
  );
}
