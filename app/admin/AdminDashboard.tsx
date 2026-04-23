"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";

interface QuizStats {
  total: number;
  facile: number;
  moyen: number;
  difficile: number;
}

interface Location {
  id: number;
  communeName: string;
  category: string;
  eventDescription: string | null;
}

interface Portrait {
  id: number;
  name: string;
  file: string;
  gender: string;
}

interface EpisodeData {
  id: number;
  title: string;
  season: number | null;
  episode: number | null;
  airDate: string | null;
  hasDescription: boolean;
  hasWikiSummary: boolean;
  keywordCount: number;
  locations: Location[];
  locationCount: number;
  quiz: QuizStats;
  portraits: Portrait[];
  portraitCount: number;
}

interface Summary {
  totalEpisodes: number;
  withLocations: number;
  totalPins: number;
  withQuiz: number;
  totalQuestions: number;
  withPortraits: number;
  totalPortraits: number;
  withDescription: number;
  withWikiSummary: number;
  withKeywords: number;
}

interface DashboardData {
  summary: Summary;
  episodes: EpisodeData[];
}

type SortField = "season" | "title" | "locationCount" | "quiz" | "portraitCount" | "coverage";
type SortDir = "asc" | "desc";
type FilterMode = "all" | "missing-pins" | "missing-quiz" | "missing-portrait" | "complete" | "empty";

export default function AdminDashboard() {
  const [authed, setAuthed] = useState(false);
  const [credentials, setCredentials] = useState("");
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [sortField, setSortField] = useState<SortField>("season");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async (creds: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/dashboard", {
        headers: { Authorization: `Basic ${creds}` },
      });
      if (res.status === 401) {
        setError("Identifiants incorrects");
        setAuthed(false);
        return;
      }
      const json = await res.json();
      setData(json);
      setAuthed(true);
    } catch {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }, []);

  // Try to reuse credentials from sessionStorage on mount
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

  // Login screen
  if (!authed) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <form onSubmit={handleLogin} className="w-full max-w-xs space-y-4">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-[var(--fg)]">Admin</h1>
            <p className="text-xs text-[var(--fg-dim)] mt-1">Accès restreint</p>
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

  if (!data) return null;

  const { summary, episodes } = data;

  // Coverage helpers
  const pct = (n: number, total: number) =>
    total === 0 ? 0 : Math.round((n / total) * 100);

  const coverageScore = (ep: EpisodeData) => {
    let s = 0;
    if (ep.locationCount > 0) s++;
    if (ep.quiz.total > 0) s++;
    if (ep.portraitCount > 0) s++;
    return s;
  };

  // Filter
  let filtered = episodes;
  if (filter === "missing-pins") filtered = episodes.filter((e) => e.locationCount === 0);
  else if (filter === "missing-quiz") filtered = episodes.filter((e) => e.quiz.total === 0);
  else if (filter === "missing-portrait") filtered = episodes.filter((e) => e.portraitCount === 0);
  else if (filter === "complete") filtered = episodes.filter((e) => coverageScore(e) === 3);
  else if (filter === "empty") filtered = episodes.filter((e) => coverageScore(e) === 0);

  // Search
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        String(e.season).includes(q) ||
        String(e.id).includes(q)
    );
  }

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    switch (sortField) {
      case "season":
        return ((a.season ?? 999) - (b.season ?? 999) || (a.episode ?? 999) - (b.episode ?? 999)) * dir;
      case "title":
        return a.title.localeCompare(b.title, "fr") * dir;
      case "locationCount":
        return (a.locationCount - b.locationCount) * dir;
      case "quiz":
        return (a.quiz.total - b.quiz.total) * dir;
      case "portraitCount":
        return (a.portraitCount - b.portraitCount) * dir;
      case "coverage":
        return (coverageScore(a) - coverageScore(b)) * dir;
      default:
        return 0;
    }
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const sortArrow = (field: SortField) =>
    sortField === field ? (sortDir === "asc" ? " \u2191" : " \u2193") : "";

  const Dot = ({ filled, color }: { filled: boolean; color: string }) => (
    <span
      className="inline-block w-2.5 h-2.5 rounded-full border"
      style={{
        backgroundColor: filled ? color : "transparent",
        borderColor: color,
        opacity: filled ? 1 : 0.3,
      }}
    />
  );

  const StatCard = ({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) => (
    <div className="border border-[var(--border)] rounded-lg bg-[var(--bg-card)] p-4">
      <div className="text-[10px] text-[var(--fg-dim)] uppercase tracking-wider mb-1">{label}</div>
      <div className="text-2xl font-bold" style={{ color }}>{value}</div>
      <div className="text-xs text-[var(--fg-dim)] mt-1">{sub}</div>
    </div>
  );

  return (
    <div className="flex-1 px-4 py-6 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[var(--fg)]">Tableau de bord</h1>
          <p className="text-xs text-[var(--fg-dim)] mt-0.5">{summary.totalEpisodes} episodes indexees</p>
        </div>
        <button
          onClick={() => fetchData(credentials)}
          disabled={loading}
          className="px-3 py-1.5 rounded border border-[var(--border)] text-xs text-[var(--fg-muted)] hover:border-[var(--border-hover)] transition-colors disabled:opacity-50"
        >
          {loading ? "..." : "Rafraichir"}
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Carte"
          value={`${pct(summary.withLocations, summary.totalEpisodes)}%`}
          sub={`${summary.withLocations}/${summary.totalEpisodes} episodes — ${summary.totalPins} pins`}
          color="var(--accent-link)"
        />
        <StatCard
          label="Quiz"
          value={`${pct(summary.withQuiz, summary.totalEpisodes)}%`}
          sub={`${summary.withQuiz}/${summary.totalEpisodes} episodes — ${summary.totalQuestions} questions`}
          color="var(--success)"
        />
        <StatCard
          label="Tapissage"
          value={`${pct(summary.withPortraits, summary.totalEpisodes)}%`}
          sub={`${summary.withPortraits}/${summary.totalEpisodes} episodes — ${summary.totalPortraits} portraits`}
          color="var(--brand-orange)"
        />
        <StatCard
          label="Couverture totale"
          value={`${pct(
            episodes.filter((e) => coverageScore(e) === 3).length,
            summary.totalEpisodes
          )}%`}
          sub={`${episodes.filter((e) => coverageScore(e) === 3).length} episodes completes`}
          color="var(--brand-red)"
        />
      </div>

      {/* Data quality */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="border border-[var(--border)] rounded-lg bg-[var(--bg-card)] p-3 text-center">
          <div className="text-[10px] text-[var(--fg-dim)] uppercase tracking-wider mb-1">Description</div>
          <div className="text-sm font-semibold text-[var(--fg)]">{summary.withDescription}/{summary.totalEpisodes}</div>
        </div>
        <div className="border border-[var(--border)] rounded-lg bg-[var(--bg-card)] p-3 text-center">
          <div className="text-[10px] text-[var(--fg-dim)] uppercase tracking-wider mb-1">Wiki Summary</div>
          <div className="text-sm font-semibold text-[var(--fg)]">{summary.withWikiSummary}/{summary.totalEpisodes}</div>
        </div>
        <div className="border border-[var(--border)] rounded-lg bg-[var(--bg-card)] p-3 text-center">
          <div className="text-[10px] text-[var(--fg-dim)] uppercase tracking-wider mb-1">Keywords</div>
          <div className="text-sm font-semibold text-[var(--fg)]">{summary.withKeywords}/{summary.totalEpisodes}</div>
        </div>
      </div>

      {/* Filters & search */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          type="text"
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-1.5 rounded border border-[var(--border)] bg-[var(--bg-input)] text-[var(--fg)] text-xs w-48 focus:outline-none focus:border-[var(--border-hover)]"
        />
        {(
          [
            ["all", "Tous"],
            ["missing-pins", "Sans pins"],
            ["missing-quiz", "Sans quiz"],
            ["missing-portrait", "Sans portrait"],
            ["complete", "Complets"],
            ["empty", "Vides"],
          ] as [FilterMode, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${
              filter === key
                ? "bg-[var(--brand-red)] text-white"
                : "border border-[var(--border)] text-[var(--fg-dim)] hover:border-[var(--border-hover)]"
            }`}
          >
            {label}
            {key !== "all" && (
              <span className="ml-1 opacity-70">
                {key === "missing-pins" && episodes.filter((e) => e.locationCount === 0).length}
                {key === "missing-quiz" && episodes.filter((e) => e.quiz.total === 0).length}
                {key === "missing-portrait" && episodes.filter((e) => e.portraitCount === 0).length}
                {key === "complete" && episodes.filter((e) => coverageScore(e) === 3).length}
                {key === "empty" && episodes.filter((e) => coverageScore(e) === 0).length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="text-xs text-[var(--fg-dim)] mb-2">{sorted.length} resultats</div>

      {/* Episode list */}
      <div className="border border-[var(--border)] rounded-lg overflow-hidden text-xs">
        {/* Header */}
        <div className="grid grid-cols-[28px_70px_1fr_60px_60px_60px_90px] items-center px-3 py-2 bg-[var(--bg-card)] border-b border-[var(--border)] text-[var(--fg-dim)]">
          <span />
          <span
            className="cursor-pointer hover:text-[var(--fg)] select-none"
            onClick={() => toggleSort("season")}
          >
            #S/E{sortArrow("season")}
          </span>
          <span
            className="cursor-pointer hover:text-[var(--fg)] select-none"
            onClick={() => toggleSort("title")}
          >
            Titre{sortArrow("title")}
          </span>
          <span
            className="text-center cursor-pointer hover:text-[var(--fg)] select-none"
            onClick={() => toggleSort("locationCount")}
          >
            Carte{sortArrow("locationCount")}
          </span>
          <span
            className="text-center cursor-pointer hover:text-[var(--fg)] select-none"
            onClick={() => toggleSort("quiz")}
          >
            Quiz{sortArrow("quiz")}
          </span>
          <span
            className="text-center cursor-pointer hover:text-[var(--fg)] select-none"
            onClick={() => toggleSort("portraitCount")}
          >
            Portrait{sortArrow("portraitCount")}
          </span>
          <span
            className="text-center cursor-pointer hover:text-[var(--fg)] select-none"
            onClick={() => toggleSort("coverage")}
          >
            Couverture{sortArrow("coverage")}
          </span>
        </div>

        {/* Rows */}
        <div>
          {sorted.map((ep) => {
            const isExpanded = expandedId === ep.id;
            return (
              <div key={ep.id}>
                <div
                  className="grid grid-cols-[28px_70px_1fr_60px_60px_60px_90px] items-center px-3 py-2 border-b border-[var(--border)] hover:bg-[var(--bg-card)] transition-colors"
                >
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : ep.id)}
                          className="text-[var(--fg-dim)] hover:text-[var(--fg)] transition-transform"
                          style={{ transform: isExpanded ? "rotate(90deg)" : "none" }}
                        >
                          &#9656;
                        </button>
                        <span className="text-[var(--fg-dim)] font-mono">
                          {ep.season != null ? `S${ep.season}E${ep.episode}` : `#${ep.id}`}
                        </span>
                        <Link
                          href={`/admin/episode/${ep.id}`}
                          className="text-[var(--fg)] truncate pr-2 hover:text-[var(--brand-red)] transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {ep.title}
                        </Link>
                        <span className="text-center">
                          {ep.locationCount > 0 ? (
                            <span className="text-[var(--accent-link)]">{ep.locationCount}</span>
                          ) : (
                            <span className="text-[var(--fg-dim)] opacity-30">0</span>
                          )}
                        </span>
                        <span className="text-center">
                          {ep.quiz.total > 0 ? (
                            <span className="text-[var(--success)]">{ep.quiz.total}</span>
                          ) : (
                            <span className="text-[var(--fg-dim)] opacity-30">0</span>
                          )}
                        </span>
                        <span className="text-center">
                          {ep.portraitCount > 0 ? (
                            <span className="text-[var(--brand-orange)]">{ep.portraitCount}</span>
                          ) : (
                            <span className="text-[var(--fg-dim)] opacity-30">0</span>
                          )}
                        </span>
                        <span className="flex justify-center gap-1">
                          <Dot filled={ep.locationCount > 0} color="var(--accent-link)" />
                          <Dot filled={ep.quiz.total > 0} color="var(--success)" />
                          <Dot filled={ep.portraitCount > 0} color="var(--brand-orange)" />
                        </span>
                      </div>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div className="px-4 py-3 bg-[var(--bg-card)] border-b border-[var(--border)] space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {/* Locations */}
                            <div>
                              <div className="text-[10px] text-[var(--fg-dim)] uppercase tracking-wider mb-1.5">
                                Localisations ({ep.locationCount})
                              </div>
                              {ep.locations.length > 0 ? (
                                <ul className="space-y-1">
                                  {ep.locations.map((loc) => (
                                    <li key={loc.id} className="text-xs text-[var(--fg-muted)]">
                                      <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: "var(--accent-link)" }} />
                                      {loc.communeName}
                                      <span className="text-[var(--fg-dim)] ml-1">({loc.category})</span>
                                      {loc.eventDescription && (
                                        <span className="text-[var(--fg-dim)]"> — {loc.eventDescription}</span>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-xs text-[var(--fg-dim)] italic">Aucune localisation</p>
                              )}
                            </div>

                            {/* Quiz */}
                            <div>
                              <div className="text-[10px] text-[var(--fg-dim)] uppercase tracking-wider mb-1.5">
                                Questions quiz ({ep.quiz.total})
                              </div>
                              {ep.quiz.total > 0 ? (
                                <div className="flex gap-3 text-xs">
                                  <span className="text-[var(--success)]">Facile: {ep.quiz.facile}</span>
                                  <span className="text-[var(--brand-orange)]">Moyen: {ep.quiz.moyen}</span>
                                  <span className="text-[var(--brand-red)]">Difficile: {ep.quiz.difficile}</span>
                                </div>
                              ) : (
                                <p className="text-xs text-[var(--fg-dim)] italic">Aucune question</p>
                              )}
                            </div>

                            {/* Portrait */}
                            <div>
                              <div className="text-[10px] text-[var(--fg-dim)] uppercase tracking-wider mb-1.5">
                                Portraits ({ep.portraitCount})
                              </div>
                              {ep.portraits.length > 0 ? (
                                <ul className="space-y-1">
                                  {ep.portraits.map((p) => (
                                    <li key={p.id} className="text-xs text-[var(--fg-muted)]">
                                      {p.name} <span className="text-[var(--fg-dim)]">({p.gender})</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-xs text-[var(--fg-dim)] italic">Aucun portrait</p>
                              )}
                            </div>
                          </div>

                          {/* Metadata */}
                          <div className="flex flex-wrap gap-3 pt-2 border-t border-[var(--border)] text-[10px] text-[var(--fg-dim)]">
                            <span>ID: {ep.id}</span>
                            <span>Description: {ep.hasDescription ? "oui" : "non"}</span>
                            <span>Wiki: {ep.hasWikiSummary ? "oui" : "non"}</span>
                            <span>Keywords: {ep.keywordCount}</span>
                            {ep.airDate && <span>Diffusion: {new Date(ep.airDate).toLocaleDateString("fr-FR")}</span>}
                          </div>
                        </div>
                      )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
