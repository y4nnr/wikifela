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
    <div className="flex items-center w-full rounded border border-gray-700 bg-[#0a0a0a] font-mono">
      <span className="ml-3 text-green-600 text-sm shrink-0">&gt;</span>
      <input
        ref={!hasQuery ? inputRef : undefined}
        type="text"
        defaultValue={hasQuery ? query : undefined}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="rechercher..."
        autoFocus
        className="w-full py-2.5 px-2 text-sm bg-transparent outline-none text-green-400 placeholder:text-gray-600 font-mono"
      />
      {hasQuery && (
        <button
          type="button"
          onClick={() => {
            setQuery("");
            setResults([]);
          }}
          className="mr-3 text-gray-600 hover:text-gray-400 shrink-0"
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
          <div className="border border-gray-700 rounded-lg bg-[#111] p-4 sm:p-6 max-w-xl w-full mb-4">
            <div className="border-b border-gray-800 pb-3 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-mono text-green-700 uppercase tracking-widest">
                Système actif — Terminal sécurisé
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-mono font-bold tracking-widest text-green-400 mb-1 text-center">
              &gt; FNAEF_
            </h1>
            <p className="text-[10px] font-mono text-gray-500 tracking-wider text-center mb-5">
              FICHIER NATIONAL AUTOMATISÉ DES ÉPISODES DE FELA
            </p>

            {searchInput}

            <div className="border-t border-gray-800 pt-3 mt-4 flex justify-between">
              <p className="text-[10px] font-mono text-gray-600">
                313 dossiers chargés
              </p>
              <p className="text-[10px] font-mono text-green-700">
                Accès autorisé
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              const id = Math.floor(Math.random() * 313) + 1;
              window.location.href = `/episode/${id}`;
            }}
            className="px-4 py-2 text-xs font-mono text-gray-500 border border-gray-700 rounded bg-[#111] hover:border-gray-500 hover:text-green-400 transition-colors"
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
