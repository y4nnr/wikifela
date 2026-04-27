"use client";

import { useEffect, useState } from "react";

export function useAdminCreds(): [string, (v: string) => void] {
  const [creds, setCreds] = useState("");
  useEffect(() => {
    const saved = sessionStorage.getItem("admin-creds");
    if (saved) setCreds(saved);
  }, []);
  return [creds, setCreds];
}

interface Props {
  onAuthenticated: (creds: string) => void;
  children?: React.ReactNode;
}

export default function AdminAuthGate({ onAuthenticated, children }: Props) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [authed, setAuthed] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem("admin-creds");
    if (saved) {
      setAuthed(true);
      onAuthenticated(saved);
    }
    setChecked(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!checked) return null;

  if (authed) return <>{children}</>;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const creds = btoa(`${user}:${pass}`);
    // Verify by hitting a known admin endpoint
    const res = await fetch("/api/admin/dashboard", {
      headers: { Authorization: `Basic ${creds}` },
    });
    if (res.status === 401) {
      setError("Identifiants incorrects");
      return;
    }
    sessionStorage.setItem("admin-creds", creds);
    setAuthed(true);
    onAuthenticated(creds);
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4">
      <form onSubmit={handleLogin} className="w-full max-w-xs space-y-4">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-[var(--fg)]">Admin</h1>
          <p className="text-xs text-[var(--fg-dim)] mt-1">Acces restreint</p>
        </div>
        <input
          type="text"
          placeholder="Utilisateur"
          value={user}
          onChange={(e) => setUser(e.target.value)}
          className="w-full px-3 py-2 rounded border border-[var(--border)] bg-[var(--bg-input)] text-[var(--fg)] text-sm focus:outline-none focus:border-[var(--border-hover)]"
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          className="w-full px-3 py-2 rounded border border-[var(--border)] bg-[var(--bg-input)] text-[var(--fg)] text-sm focus:outline-none focus:border-[var(--border-hover)]"
        />
        {error && <p className="text-xs text-[var(--brand-red)]">{error}</p>}
        <button
          type="submit"
          className="w-full py-2 rounded bg-[var(--brand-red)] text-white text-sm font-semibold hover:bg-[var(--brand-red-hover)] transition-colors"
        >
          Connexion
        </button>
      </form>
    </div>
  );
}
