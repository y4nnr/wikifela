"use client";

import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import MapFilters from "@/components/MapFilters";
import { useTheme } from "@/components/ThemeProvider";
import { COLORS } from "@/lib/map-colors";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

interface MapLocation {
  communeName: string;
  department: string;
  departmentName: string;
  latitude: number;
  longitude: number;
  eventDescription?: string | null;
  category?: string;
}

interface MapEpisode {
  id: number;
  title: string;
  season: number | null;
  episode: number | null;
  airDate: string | null;
  keywords: string[];
  locations: MapLocation[];
}

async function fetchEpisodesApi(filters: {
  department: string;
  crime: string;
  from: string;
  to: string;
  affaireIds: string[];
}): Promise<MapEpisode[]> {
  const params = new URLSearchParams();
  if (filters.department) params.set("department", filters.department);
  if (filters.crime) params.set("crime", filters.crime);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.affaireIds.length > 0) params.set("affaires", filters.affaireIds.join(","));

  try {
    const res = await fetch(`/api/map?${params}`);
    const data = await res.json();
    return data.episodes ?? [];
  } catch {
    return [];
  }
}

export default function MapClient() {
  const searchParams = useSearchParams();
  const affaireParam = searchParams.get("affaire");
  const initialAffaireIds = affaireParam ? [affaireParam] : [];

  const [episodes, setEpisodes] = useState<MapEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const [selectedAffaireIds, setSelectedAffaireIds] = useState<string[]>(initialAffaireIds);

  const handleFilterChange = useCallback(
    async (filters: {
      department: string;
      crime: string;
      from: string;
      to: string;
      affaireIds: string[];
    }) => {
      setLoading(true);
      setSelectedAffaireIds(filters.affaireIds);
      const eps = await fetchEpisodesApi(filters);
      setEpisodes(eps);
      setLoading(false);
    },
    []
  );

  // Build color map: assign distinct colors when 2+ affaires are selected
  const colorMap = useMemo(() => {
    const map = new Map<number, string>();
    if (selectedAffaireIds.length >= 2) {
      selectedAffaireIds.forEach((id, i) => {
        map.set(parseInt(id, 10), COLORS[i % COLORS.length]);
      });
    }
    return map;
  }, [selectedAffaireIds]);

  const totalLocations = episodes.reduce((sum, ep) => sum + ep.locations.length, 0);

  return (
    <div className="flex flex-col h-[calc(100dvh-49px-64px)] md:h-[calc(100dvh-49px)]">
      <MapFilters
        initialAffaireIds={initialAffaireIds}
        onFilterChange={handleFilterChange}
      />
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-[1000] bg-[var(--bg)]/80">
            <p className="text-[var(--fg-muted)] text-sm">Chargement de la carte...</p>
          </div>
        )}
        <MapView episodes={episodes} colorMap={colorMap} theme={theme} />
      </div>
      <div className="px-4 py-2 border-t border-[var(--border)] text-xs text-[var(--fg-dim)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-[#fe0000]" /> Crime</span>
          <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-[#22c55e]" /> Arrestation</span>
          <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-[#3b82f6]" /> Tribunal</span>
        </div>
        {!loading && (
          <span>
            {episodes.length} épisode{episodes.length !== 1 ? "s" : ""} — {totalLocations} lieu{totalLocations !== 1 ? "x" : ""}
          </span>
        )}
      </div>
    </div>
  );
}
