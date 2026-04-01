"use client";

import { useEffect, useMemo, useRef, useState } from "react";

interface EpisodeItem {
  id: number;
  title: string;
  season: number | null;
  episode: number | null;
}

interface FilterData {
  departments: { code: string; name: string }[];
  crimeTypes: string[];
  episodes: EpisodeItem[];
}

interface MapFiltersProps {
  initialAffaireIds?: string[];
  onFilterChange: (filters: {
    department: string;
    crime: string;
    from: string;
    to: string;
    affaireIds: string[];
  }) => void;
}

export default function MapFilters({ initialAffaireIds, onFilterChange }: MapFiltersProps) {
  const [filterData, setFilterData] = useState<FilterData | null>(null);
  const [department, setDepartment] = useState("");
  const [affaireIds, setAffaireIds] = useState<string[]>(initialAffaireIds ?? []);
  const [affaireSearch, setAffaireSearch] = useState("");
  const [affaireDropdownOpen, setAffaireDropdownOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [crime, setCrime] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/map/filters")
      .then((r) => r.json())
      .then(setFilterData)
      .catch(() => {});
  }, []);

  useEffect(() => {
    onFilterChange({ department, crime, from, to, affaireIds });
  }, [department, crime, from, to, affaireIds, onFilterChange]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAffaireDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const hasFilters = department || crime || from || to || affaireIds.length > 0;

  const reset = () => {
    setDepartment("");
    setAffaireIds([]);
    setAffaireSearch("");
    setCrime("");
    setFrom("");
    setTo("");
  };

  const toggleAffaire = (id: string) => {
    setAffaireIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Group episodes by season, filter by search
  const groupedEpisodes = useMemo(() => {
    if (!filterData) return new Map<number, EpisodeItem[]>();

    const search = affaireSearch.toLowerCase();
    const filtered = search
      ? filterData.episodes.filter((ep) => ep.title.toLowerCase().includes(search))
      : filterData.episodes;

    const groups = new Map<number, EpisodeItem[]>();
    for (const ep of filtered) {
      const season = ep.season ?? 0;
      if (!groups.has(season)) groups.set(season, []);
      groups.get(season)!.push(ep);
    }
    return groups;
  }, [filterData, affaireSearch]);

  const selectedTitles = filterData?.episodes
    .filter((ep) => affaireIds.includes(String(ep.id)))
    .map((ep) => ep.title) ?? [];

  const selectClass =
    "bg-[var(--bg-input)] border border-[var(--border)] text-[var(--fg)] text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--border-hover)]";
  const inputClass =
    "bg-[var(--bg-input)] border border-[var(--border)] text-[var(--fg)] text-sm rounded-lg px-3 py-2 w-20 focus:outline-none focus:border-[var(--border-hover)]";

  return (
    <div className="border-b border-[var(--border)]">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
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

        {/* Multi-select affaire dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setAffaireDropdownOpen(!affaireDropdownOpen)}
            className={`${selectClass} text-left min-w-0 sm:min-w-[240px] max-w-full sm:max-w-[320px] truncate`}
          >
            {affaireIds.length === 0
              ? "Toutes les affaires"
              : affaireIds.length === 1
                ? selectedTitles[0]
                : `${affaireIds.length} affaires sélectionnées`}
          </button>

          {affaireDropdownOpen && (
            <div className="absolute z-[2000] mt-1 w-[calc(100vw-2rem)] sm:w-96 left-0 sm:left-auto bg-[var(--bg-input)] border border-[var(--border)] rounded-lg shadow-xl max-h-96 flex flex-col">
              <div className="p-2 border-b border-[var(--border)]">
                <input
                  type="text"
                  placeholder="Rechercher une affaire..."
                  value={affaireSearch}
                  onChange={(e) => setAffaireSearch(e.target.value)}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)] text-sm rounded px-2 py-1.5 focus:outline-none focus:border-[var(--border-hover)] placeholder:text-[var(--fg-dim)]"
                  autoFocus
                />
              </div>
              <div className="overflow-y-auto flex-1">
                {[...groupedEpisodes.entries()].map(([season, eps]) => (
                  <div key={season}>
                    <div className="sticky top-0 bg-[var(--bg-card)] px-3 py-1.5 text-xs font-semibold text-[var(--fg-muted)] border-b border-[var(--border)]">
                      {season === 0 ? "Hors saison" : `Saison ${season}`}
                    </div>
                    {eps.map((ep) => {
                      const checked = affaireIds.includes(String(ep.id));
                      return (
                        <label
                          key={ep.id}
                          className={`flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer hover:bg-[var(--bg-input)] ${
                            checked ? "text-[var(--accent)]" : "text-[var(--fg-muted)]"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleAffaire(String(ep.id))}
                            className="accent-[var(--brand-red)] shrink-0"
                          />
                          <span className="text-[var(--fg-dim)] shrink-0 w-6 text-xs">
                            {ep.episode ?? ""}
                          </span>
                          <span className="truncate">{ep.title}</span>
                        </label>
                      );
                    })}
                  </div>
                ))}
                {groupedEpisodes.size === 0 && (
                  <p className="text-xs text-[var(--fg-dim)] px-3 py-3">Aucun résultat</p>
                )}
              </div>
              {affaireIds.length > 0 && (
                <div className="p-2 border-t border-[var(--border)]">
                  <button
                    onClick={() => { setAffaireIds([]); setAffaireDropdownOpen(false); }}
                    className="text-xs text-[var(--brand-red)] hover:underline"
                  >
                    Tout désélectionner
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
        >
          {showAdvanced ? "Masquer les filtres" : "Filtres avancés"}
        </button>

        {hasFilters && (
          <button
            onClick={reset}
            className="text-sm text-[var(--brand-red)] hover:underline ml-auto"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {showAdvanced && (
        <div className="flex flex-wrap items-center gap-3 px-4 pb-3">
          <select
            value={crime}
            onChange={(e) => setCrime(e.target.value)}
            className={selectClass}
          >
            <option value="">Tous les types de crime</option>
            {filterData?.crimeTypes.map((c) => (
              <option key={c} value={c}>
                {c}
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
    </div>
  );
}
