"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import PageTitle from "@/components/PageTitle";

interface Episode {
  id: number;
  title: string;
  season: number | null;
  episode: number | null;
  airDate: string | null;
  keywords: string[];
}

interface FilterData {
  seasons: number[];
  crimeTypes: string[];
  departments: { code: string; name: string }[];
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function EpisodesClient() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [filterData, setFilterData] = useState<FilterData | null>(null);
  const [loading, setLoading] = useState(true);

  const [season, setSeason] = useState("");
  const [crime, setCrime] = useState("");
  const [department, setDepartment] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    fetch("/api/episodes/filters")
      .then((r) => r.json())
      .then(setFilterData)
      .catch(() => {});
  }, []);

  const fetchEpisodes = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (season) params.set("season", season);
    if (crime) params.set("crime", crime);
    if (department) params.set("department", department);
    if (from) params.set("from", from);
    if (to) params.set("to", to);

    try {
      const res = await fetch(`/api/episodes?${params}`);
      const data = await res.json();
      setEpisodes(data.episodes ?? []);
    } catch {
      setEpisodes([]);
    } finally {
      setLoading(false);
    }
  }, [season, crime, department, from, to]);

  useEffect(() => {
    fetchEpisodes();
  }, [fetchEpisodes]);

  const hasFilters = season || crime || department || from || to;

  const reset = () => {
    setSeason("");
    setCrime("");
    setDepartment("");
    setFrom("");
    setTo("");
  };

  // Group by season
  const seasons = new Map<number, Episode[]>();
  for (const ep of episodes) {
    const s = ep.season ?? 0;
    if (!seasons.has(s)) seasons.set(s, []);
    seasons.get(s)!.push(ep);
  }

  const [showFilters, setShowFilters] = useState(false);

  const selectClass =
    "bg-[var(--bg-input)] border border-[var(--border)] text-[var(--fg)] text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-gray-500";
  const inputClass =
    "bg-[var(--bg-input)] border border-[var(--border)] text-[var(--fg)] text-sm rounded-lg px-3 py-2 w-20 focus:outline-none focus:border-gray-500";

  return (
    <div className="flex-1">
      <div className="max-w-3xl mx-auto w-full">
        <PageTitle
          title="Épisodes"
          subtitle={loading ? "Chargement..." : `${episodes.length} épisode${episodes.length !== 1 ? "s" : ""}`}
        >
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-[var(--border)] text-gray-300 hover:border-gray-500 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            {showFilters ? "Masquer" : "Filtres"}
          </button>
          {hasFilters && (
            <button
              onClick={reset}
              className="text-xs text-[#fe0000] hover:underline"
            >
              Réinitialiser
            </button>
          )}
        </PageTitle>

        {/* Filters */}
        {showFilters && (
        <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 pb-6 border-b border-[var(--border)] px-4">
          <select
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            className={selectClass}
          >
            <option value="">Toutes les saisons</option>
            {filterData?.seasons.map((s) => (
              <option key={s} value={s}>
                Saison {s}
              </option>
            ))}
          </select>

          <select
            value={crime}
            onChange={(e) => setCrime(e.target.value)}
            className={selectClass}
          >
            <option value="">Tous les crimes</option>
            {filterData?.crimeTypes.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className={selectClass}
          >
            <option value="">Tous les départements</option>
            {filterData?.departments.map((d) => (
              <option key={d.code} value={d.code}>
                {d.name} ({d.code})
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2 text-sm text-[var(--fg-muted)]">
            <span>De</span>
            <input
              type="number"
              placeholder="2000"
              min="1990"
              max="2030"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className={inputClass}
            />
            <span>à</span>
            <input
              type="number"
              placeholder="2025"
              min="1990"
              max="2030"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        )}

        {/* Episodes list */}
        {episodes.length === 0 && !loading && (
          <p className="text-sm text-[var(--fg-dim)] text-center py-10">
            Aucun épisode trouvé avec ces filtres.
          </p>
        )}

        <div className="space-y-8 px-4">
          {[...seasons.entries()].map(([s, eps]) => (
            <section key={s}>
              <h2 className="text-sm font-semibold text-[var(--fg-muted)] uppercase tracking-widest mb-3 sticky top-0 bg-[var(--bg)] py-2 border-b border-[var(--border)] z-10">
                {s === 0 ? "Hors saison" : `Saison ${s}`}
                <span className="text-[var(--fg-dim)] font-normal ml-2">
                  ({eps.length})
                </span>
              </h2>
              <div className="space-y-0.5">
                {eps.map((ep) => (
                  <Link
                    key={ep.id}
                    href={`/episode/${ep.id}`}
                    className="flex items-baseline gap-3 px-3 py-2.5 -mx-3 rounded-lg hover:bg-[var(--bg-card)] transition-colors group"
                  >
                    <span className="text-xs text-[var(--fg-dim)] w-6 shrink-0 text-right">
                      {ep.episode ?? ""}
                    </span>
                    <span className="text-sm text-[var(--fg)] group-hover:text-[#fcf84f] transition-colors flex-1 min-w-0 truncate">
                      {ep.title}
                    </span>
                    {ep.airDate && (
                      <span className="text-xs text-[var(--fg-dim)] shrink-0 hidden sm:block">
                        {formatDate(ep.airDate)}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
