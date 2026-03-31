"use client";

import type { SearchResult } from "@/lib/search";
import EpisodeCard from "./EpisodeCard";

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
  loading: boolean;
}

export default function SearchResults({
  results,
  query,
  loading,
}: SearchResultsProps) {
  if (!query.trim()) return null;

  if (loading) {
    return (
      <p className="text-gray-500 text-sm mt-10 text-center">Recherche...</p>
    );
  }

  if (results.length === 0) {
    return (
      <div className="w-full max-w-xl mt-10 px-4">
        <p className="text-sm text-gray-400">
          Aucun résultat pour <span className="font-semibold text-gray-200">{query}</span>.
          Essayez avec d&apos;autres mots-clés.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mt-6 px-4 pb-12">
      <p className="text-xs text-gray-500 mb-5">
        {results.length} résultat{results.length > 1 ? "s" : ""}
      </p>
      {results.map((ep) => (
        <EpisodeCard key={ep.id} episode={ep} />
      ))}
    </div>
  );
}
