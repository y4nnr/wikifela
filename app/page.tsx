"use client";

import { useCallback, useRef, useState } from "react";
import PageTitle from "@/components/PageTitle";
import SearchResults from "@/components/SearchResults";
import type { SearchResult } from "@/lib/search";

export default function Home() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const doSearch = useCallback(async (q: string) => {
    setQuery(q);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (value: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSearch(value), 300);
  };

  const hasQuery = query.trim().length > 0;

  const searchInput = (
    <div className="flex items-center w-full rounded border border-[var(--border)] bg-[var(--bg)] font-mono">
      <span className="ml-3 text-[var(--terminal)] text-sm shrink-0">&gt;</span>
      <input
        ref={!hasQuery ? inputRef : undefined}
        type="text"
        defaultValue={hasQuery ? query : undefined}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="rechercher..."
        autoFocus
        className="w-full py-2.5 px-2 text-sm bg-transparent outline-none text-[var(--terminal)] placeholder:text-[var(--fg-dim)] font-mono"
      />
      {hasQuery && (
        <button
          type="button"
          onClick={() => {
            setQuery("");
            setResults([]);
          }}
          className="mr-3 text-[var(--fg-dim)] hover:text-[var(--fg-muted)] shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );

  return (
    <div className="flex flex-col items-center flex-1">
      {/* Landing view */}
      {!hasQuery && (
        <div className="flex flex-col items-center w-full pt-[10vh] sm:pt-[15vh] px-4">
          <div className="border border-[var(--border)] rounded-lg bg-[var(--bg-card)] p-4 sm:p-6 max-w-xl w-full mb-4">
            <div className="border-b border-[var(--border)] pb-3 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse" />
              <span className="text-[10px] font-mono text-[var(--terminal-dim)] uppercase tracking-widest">
                Système actif — Terminal sécurisé
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-mono font-bold tracking-widest text-[var(--terminal)] mb-1 text-center">
              &gt; FNAEF_
            </h1>
            <p className="text-[10px] font-mono text-[var(--fg-dim)] tracking-wider text-center mb-5">
              FICHIER NATIONAL AUTOMATISÉ DES ÉPISODES DE FELA
            </p>

            {searchInput}

            <div className="border-t border-[var(--border)] pt-3 mt-4 flex justify-between">
              <p className="text-[10px] font-mono text-[var(--fg-dim)]">
                313 dossiers chargés
              </p>
              <p className="text-[10px] font-mono text-[var(--terminal-dim)]">
                Accès autorisé
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              const id = Math.floor(Math.random() * 313) + 1;
              window.location.href = `/episode/${id}`;
            }}
            className="px-4 py-2 text-xs font-mono text-[var(--fg-dim)] border border-[var(--border)] rounded bg-[var(--bg-card)] hover:border-[var(--border-hover)] hover:text-[var(--terminal)] transition-colors"
          >
            &gt; choisir_episode --random
          </button>
        </div>
      )}

      {/* Search results view */}
      {hasQuery && (
        <>
          <div className="w-full">
            <PageTitle title="Recherche" />
          </div>
          <div className="w-full max-w-xl px-4 mb-6">
            {searchInput}
          </div>
          <SearchResults results={results} query={query} loading={loading} />
        </>
      )}
    </div>
  );
}
