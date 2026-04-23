"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";

interface Location {
  id: number;
  communeName: string;
  department: string;
  departmentName: string;
  latitude: number;
  longitude: number;
  isPrimary: boolean;
  eventDescription: string | null;
  category: string;
}

interface Question {
  question: string;
  answer: string;
  options: string[];
  difficulty: string;
}

interface Portrait {
  id: number;
  name: string;
  file: string;
  subtitle: string;
  gender: string;
}

interface Episode {
  id: number;
  title: string;
  season: number | null;
  episode: number | null;
  airDate: string | null;
  description: string | null;
  keywords: string[];
  wikiSummary: string | null;
  locations: Location[];
}

interface NavEpisode {
  id: number;
  title: string;
}

interface EpisodeData {
  episode: Episode;
  questions: Question[];
  portraits: Portrait[];
  prev: NavEpisode | null;
  next: NavEpisode | null;
}

const CATEGORY_COLORS: Record<string, string> = {
  crime: "#fe0000",
  arrest: "#22c55e",
  trial: "#3b82f6",
};

const CATEGORY_LABELS: Record<string, string> = {
  crime: "Crime",
  arrest: "Arrestation",
  trial: "Tribunal",
};

function categoryColor(cat: string): string {
  return CATEGORY_COLORS[cat] || CATEGORY_COLORS.crime;
}

function categoryLabel(cat: string): string {
  return CATEGORY_LABELS[cat] || cat;
}

function getSummary(text: string): string {
  const paragraphs = text.split(/\n+/).filter((p) => {
    const t = p.trim();
    return t.length > 30 && !t.startsWith("==");
  });
  if (paragraphs.length === 0) return "";

  let summary = paragraphs[0].trim();
  if (paragraphs.length > 1 && summary.length < 300) {
    summary += " " + paragraphs[1].trim();
  }

  if (summary.length > 500) {
    const cut = summary.slice(0, 500);
    const lastDot = cut.lastIndexOf(".");
    return lastDot > 150 ? cut.slice(0, lastDot + 1) : cut + "...";
  }

  return summary;
}

export default function AdminEpisodeDetail({ id }: { id: string }) {
  const [authed, setAuthed] = useState(false);
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [credentials, setCredentials] = useState("");
  const [error, setError] = useState("");
  const [data, setData] = useState<EpisodeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const fetchData = useCallback(
    async (creds: string) => {
      setLoading(true);
      setNotFound(false);
      try {
        const res = await fetch(`/api/admin/episode/${id}`, {
          headers: { Authorization: `Basic ${creds}` },
        });
        if (res.status === 401) {
          setError("Identifiants incorrects");
          setAuthed(false);
          return;
        }
        if (res.status === 404) {
          setNotFound(true);
          setAuthed(true);
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
    },
    [id]
  );

  // Try to reuse credentials from sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem("admin-creds");
    if (saved) {
      setCredentials(saved);
      fetchData(saved);
    }
  }, [fetchData]);

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

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-[var(--fg-dim)]">Chargement...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <p className="text-sm text-[var(--fg-dim)]">Episode introuvable</p>
        <Link href="/admin" className="text-xs text-[var(--accent-link)] hover:underline">
          Retour au tableau de bord
        </Link>
      </div>
    );
  }

  if (!data) return null;

  const { episode: ep, questions, portraits, prev, next } = data;

  const Section = ({
    title,
    count,
    color,
    children,
  }: {
    title: string;
    count: number;
    color: string;
    children: React.ReactNode;
  }) => (
    <div className="border border-[var(--border)] rounded-lg bg-[var(--bg-card)] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border)]">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-xs font-semibold text-[var(--fg)]">{title}</span>
        <span className="text-xs text-[var(--fg-dim)] ml-auto">{count}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );

  const Badge = ({ label, color }: { label: string; color?: string }) => (
    <span
      className="inline-block px-2 py-0.5 rounded text-[10px] border"
      style={{
        borderColor: color || "var(--border)",
        color: color || "var(--fg-dim)",
      }}
    >
      {label}
    </span>
  );

  const difficultyColor = (d: string) => {
    if (d === "facile") return "var(--success)";
    if (d === "moyen") return "var(--brand-orange)";
    return "var(--brand-red)";
  };

  return (
    <div className="flex-1 px-4 py-6 max-w-5xl mx-auto w-full">
      {/* Nav */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/admin"
          className="text-xs text-[var(--fg-dim)] hover:text-[var(--fg)] transition-colors"
        >
          &larr; Tableau de bord
        </Link>
        <div className="flex gap-3 text-xs">
          {prev && (
            <Link
              href={`/admin/episode/${prev.id}`}
              className="text-[var(--fg-dim)] hover:text-[var(--fg)] transition-colors"
              title={prev.title}
            >
              &larr; Precedent
            </Link>
          )}
          {next && (
            <Link
              href={`/admin/episode/${next.id}`}
              className="text-[var(--fg-dim)] hover:text-[var(--fg)] transition-colors"
              title={next.title}
            >
              Suivant &rarr;
            </Link>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start gap-3 mb-2">
          {portraits.length > 0 && (
            <div className="w-16 h-20 rounded overflow-hidden flex-shrink-0 border border-[var(--border)]">
              <Image
                src={`/portraits/${portraits[0].file}`}
                alt={portraits[0].name}
                width={64}
                height={80}
                className="object-cover w-full h-full"
              />
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-[var(--fg)]">{ep.title}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-[var(--fg-dim)]">
              {ep.season != null && (
                <span>
                  Saison {ep.season}, Episode {ep.episode}
                </span>
              )}
              {ep.airDate && (
                <span>
                  — {new Date(ep.airDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                </span>
              )}
              <span className="ml-auto font-mono">ID: {ep.id}</span>
            </div>
          </div>
        </div>

        {/* Keywords */}
        {ep.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {ep.keywords.map((kw) => (
              <Badge key={kw} label={kw} />
            ))}
          </div>
        )}
      </div>

      {/* Coverage summary bar */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div
          className="rounded-lg p-3 text-center border"
          style={{
            borderColor: ep.locations.length > 0 ? "var(--accent-link)" : "var(--border)",
            opacity: ep.locations.length > 0 ? 1 : 0.4,
          }}
        >
          <div className="text-lg font-bold" style={{ color: "var(--accent-link)" }}>
            {ep.locations.length}
          </div>
          <div className="text-[10px] text-[var(--fg-dim)] uppercase">Pins</div>
        </div>
        <div
          className="rounded-lg p-3 text-center border"
          style={{
            borderColor: questions.length > 0 ? "var(--success)" : "var(--border)",
            opacity: questions.length > 0 ? 1 : 0.4,
          }}
        >
          <div className="text-lg font-bold" style={{ color: "var(--success)" }}>
            {questions.length}
          </div>
          <div className="text-[10px] text-[var(--fg-dim)] uppercase">Questions</div>
        </div>
        <div
          className="rounded-lg p-3 text-center border"
          style={{
            borderColor: portraits.length > 0 ? "var(--brand-orange)" : "var(--border)",
            opacity: portraits.length > 0 ? 1 : 0.4,
          }}
        >
          <div className="text-lg font-bold" style={{ color: "var(--brand-orange)" }}>
            {portraits.length}
          </div>
          <div className="text-[10px] text-[var(--fg-dim)] uppercase">Portraits</div>
        </div>
      </div>

      {/* What users see */}
      {(ep.description || ep.wikiSummary) && (
        <div className="border border-[var(--border)] rounded-lg bg-[var(--bg-card)] p-4 mb-6">
          <div className="text-[10px] text-[var(--fg-dim)] uppercase tracking-wider mb-2">
            Vue utilisateur
          </div>
          {ep.description && (
            <p className="text-[var(--fg-muted)] leading-relaxed mb-3">{ep.description}</p>
          )}
          {ep.wikiSummary && (
            <p className="text-sm text-[var(--fg-muted)] leading-relaxed">
              {getSummary(ep.wikiSummary)}
            </p>
          )}
        </div>
      )}

      {/* Detailed sections */}
      <div className="space-y-4">
        {/* Locations */}
        <Section title="Localisations" count={ep.locations.length} color="var(--accent-link)">
          {ep.locations.length > 0 ? (
            <div className="space-y-2">
              {ep.locations.map((loc) => (
                <div
                  key={loc.id}
                  className="flex items-start gap-3 py-2 border-b border-[var(--border)] last:border-0"
                >
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0"
                    style={{ backgroundColor: categoryColor(loc.category) }}
                  />
                  <div className="flex-1">
                    <div className="text-sm text-[var(--fg)]">
                      {loc.communeName}
                      {loc.isPrimary && (
                        <span className="ml-1.5 text-[10px]" style={{ color: categoryColor(loc.category) }}>principal</span>
                      )}
                    </div>
                    <div className="text-xs text-[var(--fg-dim)]">
                      {loc.departmentName} ({loc.department})
                    </div>
                    {loc.eventDescription && (
                      <div className="text-xs text-[var(--fg-muted)] mt-0.5">{loc.eventDescription}</div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <Badge label={categoryLabel(loc.category)} color={categoryColor(loc.category)} />
                    <div className="text-[10px] text-[var(--fg-dim)] mt-1 font-mono">
                      {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[var(--fg-dim)] italic">
              Aucune localisation enregistree pour cet episode.
            </p>
          )}
        </Section>

        {/* Quiz questions */}
        <Section title="Questions quiz" count={questions.length} color="var(--success)">
          {questions.length > 0 ? (
            <div className="space-y-3">
              {questions.map((q, i) => (
                <div
                  key={i}
                  className="py-2 border-b border-[var(--border)] last:border-0"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="text-sm text-[var(--fg)]">{q.question}</p>
                    <Badge label={q.difficulty} color={difficultyColor(q.difficulty)} />
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {[q.answer, ...q.options].sort().map((opt) => (
                      <span
                        key={opt}
                        className={`px-2 py-0.5 rounded ${
                          opt === q.answer
                            ? "bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]"
                            : "text-[var(--fg-dim)] border border-[var(--border)]"
                        }`}
                      >
                        {opt}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[var(--fg-dim)] italic">
              Aucune question quiz pour cet episode.
            </p>
          )}
        </Section>

        {/* Portraits */}
        <Section title="Portraits" count={portraits.length} color="var(--brand-orange)">
          {portraits.length > 0 ? (
            <div className="flex flex-wrap gap-4">
              {portraits.map((p) => (
                <div key={p.id} className="flex items-center gap-3">
                  <div className="w-14 h-18 rounded overflow-hidden border border-[var(--border)]">
                    <Image
                      src={`/portraits/${p.file}`}
                      alt={p.name}
                      width={56}
                      height={72}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div>
                    <div className="text-sm text-[var(--fg)]">{p.name}</div>
                    {p.subtitle && (
                      <div className="text-xs text-[var(--fg-dim)]">{p.subtitle}</div>
                    )}
                    <Badge label={p.gender === "M" ? "Homme" : "Femme"} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[var(--fg-dim)] italic">
              Aucun portrait pour cet episode.
            </p>
          )}
        </Section>
      </div>

      {/* Full wiki summary — raw data reference */}
      {ep.wikiSummary && (
        <div className="border border-[var(--border)] rounded-lg bg-[var(--bg-card)] p-4 mt-4">
          <div className="text-[10px] text-[var(--fg-dim)] uppercase tracking-wider mb-2">
            Resume Wikipedia (texte complet en base)
          </div>
          <p className="text-sm text-[var(--fg-muted)] leading-relaxed whitespace-pre-line">{ep.wikiSummary}</p>
        </div>
      )}

      {/* Bottom nav */}
      <div className="flex justify-between mt-8 pt-4 border-t border-[var(--border)]">
        {prev ? (
          <Link
            href={`/admin/episode/${prev.id}`}
            className="text-xs text-[var(--fg-dim)] hover:text-[var(--fg)] transition-colors"
          >
            &larr; {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/admin/episode/${next.id}`}
            className="text-xs text-[var(--fg-dim)] hover:text-[var(--fg)] transition-colors"
          >
            {next.title} &rarr;
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}
