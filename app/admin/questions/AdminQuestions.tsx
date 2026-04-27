"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Question {
  id: number;
  question: string;
  answer: string;
  options: string[];
  difficulty: string;
  episodeId: number | null;
  episodeTitle: string | null;
  season: number | null;
  episode: number | null;
  category: string | null;
}

type DifficultyFilter = "all" | "facile" | "moyen" | "difficile";
type EpisodeFilter = "all" | "general" | number; // number = season

export default function AdminQuestions() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [credentials, setCredentials] = useState("");
  const [error, setError] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [seasons, setSeasons] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [diffFilter, setDiffFilter] = useState<DifficultyFilter>("all");
  const [epFilter, setEpFilter] = useState<EpisodeFilter>("all");
  const [search, setSearch] = useState("");
  const [savedBanner, setSavedBanner] = useState(false);

  useEffect(() => {
    if (searchParams.get("saved") === "1") {
      setSavedBanner(true);
      const t = setTimeout(() => {
        setSavedBanner(false);
        router.replace("/admin/questions");
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [searchParams, router]);

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer definitivement cette question ?")) return;
    const res = await fetch(`/api/admin/questions/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Basic ${credentials}` },
    });
    const json = await res.json();
    if (json.ok) {
      setQuestions((prev) => prev.filter((q) => q.id !== id));
    } else {
      alert(json.error || "Erreur lors de la suppression");
    }
  };

  const fetchData = useCallback(async (creds: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/questions", {
        headers: { Authorization: `Basic ${creds}` },
      });
      if (res.status === 401) {
        setError("Identifiants incorrects");
        setAuthed(false);
        return;
      }
      const json = await res.json();
      setQuestions(json.questions);
      setSeasons(json.seasons);
      setAuthed(true);
    } catch {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem("admin-creds");
    if (saved) {
      setCredentials(saved);
      fetchData(saved);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const creds = btoa(`${user}:${pass}`);
    setCredentials(creds);
    sessionStorage.setItem("admin-creds", creds);
    fetchData(creds);
  };

  if (!authed) {
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
            disabled={loading}
            className="w-full py-2 rounded bg-[var(--brand-red)] text-white text-sm font-semibold hover:bg-[var(--brand-red-hover)] transition-colors disabled:opacity-50"
          >
            {loading ? "Chargement..." : "Connexion"}
          </button>
        </form>
      </div>
    );
  }

  const difficultyColor = (d: string) => {
    if (d === "facile") return "var(--success)";
    if (d === "moyen") return "var(--brand-orange)";
    return "var(--brand-red)";
  };

  // Apply filters
  let filtered = questions;

  if (diffFilter !== "all") {
    filtered = filtered.filter((q) => q.difficulty === diffFilter);
  }

  if (epFilter === "general") {
    filtered = filtered.filter((q) => q.episodeId == null);
  } else if (typeof epFilter === "number") {
    filtered = filtered.filter((q) => q.season === epFilter);
  }

  if (search.trim()) {
    const s = search.toLowerCase();
    filtered = filtered.filter(
      (q) =>
        q.question.toLowerCase().includes(s) ||
        q.answer.toLowerCase().includes(s) ||
        (q.episodeTitle && q.episodeTitle.toLowerCase().includes(s))
    );
  }

  // Stats
  const totalByDiff = {
    facile: questions.filter((q) => q.difficulty === "facile").length,
    moyen: questions.filter((q) => q.difficulty === "moyen").length,
    difficile: questions.filter((q) => q.difficulty === "difficile").length,
  };
  const generalCount = questions.filter((q) => q.episodeId == null).length;

  return (
    <div className="flex-1 px-4 py-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="text-xs text-[var(--fg-dim)] hover:text-[var(--fg)] transition-colors"
            >
              &larr; Tableau de bord
            </Link>
          </div>
          <h1 className="text-xl font-bold text-[var(--fg)] mt-2">Questions quiz</h1>
          <p className="text-xs text-[var(--fg-dim)] mt-0.5">{questions.length} questions au total</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/questions/new"
            className="px-3 py-1.5 rounded bg-[var(--brand-red)] text-white text-xs font-semibold hover:bg-[var(--brand-red-hover)] transition-colors"
          >
            + Nouvelle question
          </Link>
          <button
            onClick={() => fetchData(credentials)}
            disabled={loading}
            className="px-3 py-1.5 rounded border border-[var(--border)] text-xs text-[var(--fg-muted)] hover:border-[var(--border-hover)] transition-colors disabled:opacity-50"
          >
            {loading ? "..." : "Rafraichir"}
          </button>
        </div>
      </div>

      {savedBanner && (
        <div className="border border-[var(--success)] rounded-lg bg-[var(--success)]/10 p-2 text-xs text-[var(--success)] mb-4">
          Question enregistree avec succes.
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="border border-[var(--border)] rounded-lg bg-[var(--bg-card)] p-3 text-center">
          <div className="text-lg font-bold" style={{ color: "var(--success)" }}>{totalByDiff.facile}</div>
          <div className="text-[10px] text-[var(--fg-dim)] uppercase">Facile</div>
        </div>
        <div className="border border-[var(--border)] rounded-lg bg-[var(--bg-card)] p-3 text-center">
          <div className="text-lg font-bold" style={{ color: "var(--brand-orange)" }}>{totalByDiff.moyen}</div>
          <div className="text-[10px] text-[var(--fg-dim)] uppercase">Moyen</div>
        </div>
        <div className="border border-[var(--border)] rounded-lg bg-[var(--bg-card)] p-3 text-center">
          <div className="text-lg font-bold" style={{ color: "var(--brand-red)" }}>{totalByDiff.difficile}</div>
          <div className="text-[10px] text-[var(--fg-dim)] uppercase">Difficile</div>
        </div>
        <div className="border border-[var(--border)] rounded-lg bg-[var(--bg-card)] p-3 text-center">
          <div className="text-lg font-bold text-[var(--fg-dim)]">{generalCount}</div>
          <div className="text-[10px] text-[var(--fg-dim)] uppercase">Generales</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          type="text"
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-1.5 rounded border border-[var(--border)] bg-[var(--bg-input)] text-[var(--fg)] text-xs w-48 focus:outline-none focus:border-[var(--border-hover)]"
        />

        {/* Difficulty */}
        {(["all", "facile", "moyen", "difficile"] as DifficultyFilter[]).map((d) => (
          <button
            key={d}
            onClick={() => setDiffFilter(d)}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${
              diffFilter === d
                ? "bg-[var(--brand-red)] text-white"
                : "border border-[var(--border)] text-[var(--fg-dim)] hover:border-[var(--border-hover)]"
            }`}
          >
            {d === "all" ? "Toutes" : d.charAt(0).toUpperCase() + d.slice(1)}
          </button>
        ))}

        <span className="text-[var(--border)]">|</span>

        {/* Episode filter */}
        <button
          onClick={() => setEpFilter("all")}
          className={`px-2.5 py-1 rounded text-xs transition-colors ${
            epFilter === "all"
              ? "bg-[var(--brand-red)] text-white"
              : "border border-[var(--border)] text-[var(--fg-dim)] hover:border-[var(--border-hover)]"
          }`}
        >
          Tous
        </button>
        <button
          onClick={() => setEpFilter("general")}
          className={`px-2.5 py-1 rounded text-xs transition-colors ${
            epFilter === "general"
              ? "bg-[var(--brand-red)] text-white"
              : "border border-[var(--border)] text-[var(--fg-dim)] hover:border-[var(--border-hover)]"
          }`}
        >
          Generales
        </button>

        <select
          value={typeof epFilter === "number" ? epFilter : ""}
          onChange={(e) => {
            const val = e.target.value;
            setEpFilter(val === "" ? "all" : parseInt(val, 10));
          }}
          className="px-2 py-1 rounded border border-[var(--border)] bg-[var(--bg-input)] text-[var(--fg)] text-xs focus:outline-none"
        >
          <option value="">Saison...</option>
          {seasons.map((s) => (
            <option key={s} value={s}>
              Saison {s}
            </option>
          ))}
        </select>
      </div>

      <div className="text-xs text-[var(--fg-dim)] mb-2">{filtered.length} resultats</div>

      {/* Question list */}
      <div className="space-y-2">
        {filtered.map((q) => (
          <div
            key={q.id}
            className="border border-[var(--border)] rounded-lg bg-[var(--bg-card)] p-3"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <p className="text-sm text-[var(--fg)] flex-1">{q.question}</p>
              <span
                className="inline-block px-2 py-0.5 rounded text-[10px] border flex-shrink-0"
                style={{
                  borderColor: difficultyColor(q.difficulty),
                  color: difficultyColor(q.difficulty),
                }}
              >
                {q.difficulty}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-2">
              {[q.answer, ...q.options].sort().map((opt) => (
                <span
                  key={opt}
                  className={`px-2 py-0.5 rounded text-xs ${
                    opt === q.answer
                      ? "border text-[var(--success)] border-[var(--success)]"
                      : "text-[var(--fg-dim)] border border-[var(--border)]"
                  }`}
                >
                  {opt}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between gap-3 text-[10px]">
              <div className="text-[var(--fg-dim)]">
                {q.episodeId != null ? (
                  <Link
                    href={`/admin/episode/${q.episodeId}`}
                    className="hover:text-[var(--fg)] transition-colors"
                  >
                    S{q.season}E{q.episode} — {q.episodeTitle}
                  </Link>
                ) : (
                  <span className="italic">
                    Question generale{q.category ? ` — ${q.category}` : " (hors episode)"}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <Link
                  href={`/admin/questions/${q.id}/edit`}
                  className="text-[var(--accent-link)] hover:underline"
                >
                  Modifier
                </Link>
                <button
                  onClick={() => handleDelete(q.id)}
                  className="text-[var(--brand-red)] hover:underline"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
