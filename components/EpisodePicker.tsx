"use client";

import { useEffect, useState, useRef } from "react";

interface Episode {
  id: number;
  title: string;
  season: number | null;
  episode: number | null;
}

interface Props {
  creds: string;
  value: number | null;
  onChange: (episodeId: number | null) => void;
  allowGeneral?: boolean;
  required?: boolean;
}

export default function EpisodePicker({
  creds,
  value,
  onChange,
  allowGeneral = false,
  required = false,
}: Props) {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!creds) return;
    fetch("/api/admin/episodes-lookup", {
      headers: { Authorization: `Basic ${creds}` },
    })
      .then((r) => r.json())
      .then((d) => setEpisodes(d.episodes || []));
  }, [creds]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const selected = value != null ? episodes.find((e) => e.id === value) : null;
  const displayValue =
    value == null && allowGeneral
      ? "Question generale (sans episode)"
      : selected
      ? `S${selected.season}E${selected.episode} — ${selected.title}`
      : "";

  const q = search.toLowerCase().trim();
  const filtered = q
    ? episodes.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          `s${e.season}e${e.episode}`.toLowerCase().includes(q) ||
          `saison ${e.season} episode ${e.episode}`.toLowerCase().includes(q)
      )
    : episodes;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full px-3 py-2 rounded border border-[var(--border)] bg-[var(--bg-input)] text-[var(--fg)] text-sm text-left focus:outline-none focus:border-[var(--border-hover)]"
      >
        {displayValue || (
          <span className="text-[var(--fg-dim)]">
            {required ? "Selectionner un episode..." : "Selectionner..."}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-72 overflow-y-auto border border-[var(--border)] bg-[var(--bg-card)] rounded shadow-lg">
          <input
            type="text"
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un episode..."
            className="w-full px-3 py-2 border-b border-[var(--border)] bg-[var(--bg-input)] text-[var(--fg)] text-sm focus:outline-none"
          />
          {allowGeneral && !q && (
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setOpen(false);
                setSearch("");
              }}
              className="w-full text-left px-3 py-2 text-xs text-[var(--fg-muted)] hover:bg-[var(--bg-input)] italic border-b border-[var(--border)]"
            >
              Question generale (sans episode)
            </button>
          )}
          {filtered.length === 0 ? (
            <div className="px-3 py-4 text-xs text-[var(--fg-dim)] text-center">Aucun resultat</div>
          ) : (
            filtered.slice(0, 50).map((ep) => (
              <button
                key={ep.id}
                type="button"
                onClick={() => {
                  onChange(ep.id);
                  setOpen(false);
                  setSearch("");
                }}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-[var(--bg-input)] ${
                  ep.id === value ? "bg-[var(--bg-input)]" : ""
                }`}
              >
                <span className="text-[var(--fg-dim)] font-mono mr-2">
                  S{ep.season}E{ep.episode}
                </span>
                <span className="text-[var(--fg)]">{ep.title}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
