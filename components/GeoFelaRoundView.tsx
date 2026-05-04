"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "@/components/ThemeProvider";

const GeoFelaMap = dynamic(() => import("@/components/GeoFelaMap"), { ssr: false });

export interface GeoCase {
  id: number;
  title: string;
  airDate: string | null;
  locations: {
    id: number;
    communeName: string;
    department: string;
    departmentName: string;
    latitude: number;
    longitude: number;
    category: string;
    eventDescription: string | null;
    eventDescriptionGame: string | null;
  }[];
}

export interface GeoFelaRound {
  correct: GeoCase;
  candidates: GeoCase[];
}

interface GeoFelaRoundViewProps {
  round: GeoFelaRound;
  hardMode: boolean;
  mapHeight?: string;
  onAnswered: (info: { correct: boolean; episodeId: number }) => void;
  renderAfter?: (info: { correct: boolean; episodeId: number; correctTitle: string }) => React.ReactNode;
}

export default function GeoFelaRoundView({
  round,
  hardMode,
  mapHeight = "min(45vh, 360px)",
  onAnswered,
  renderAfter,
}: GeoFelaRoundViewProps) {
  const { theme } = useTheme();
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  const correctId = round.correct.id;
  const mapKey = useMemo(() => `geofela-${correctId}`, [correctId]);

  const handleAnswer = (caseId: number) => {
    if (revealed) return;
    setSelected(caseId);
    setRevealed(true);
    onAnswered({
      correct: caseId === correctId,
      episodeId: correctId,
    });
  };

  return (
    <div className="w-full max-w-3xl">
      <div className="relative z-0 border border-[var(--border)] rounded-lg overflow-hidden mb-3" style={{ height: mapHeight }}>
        <GeoFelaMap
          key={mapKey}
          locations={round.correct.locations}
          hardMode={hardMode}
          theme={theme}
          airDate={round.correct.airDate}
        />
      </div>

      <p className="text-center text-xs text-[var(--fg-muted)] mb-3">
        Cliquez sur les pins pour voir les indices, puis identifiez l&apos;affaire :
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
        {round.candidates.map((c) => {
          let cls = "px-3 py-2.5 rounded-lg border text-sm text-left transition-all ";
          if (!revealed) {
            cls +=
              "border-[var(--border)] text-[var(--fg)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-input)]";
          } else if (c.id === correctId) {
            cls += "border-[var(--success)] text-[var(--success)] bg-[var(--success)]/10";
          } else if (c.id === selected) {
            cls += "border-[var(--brand-red)] text-[var(--brand-red)] bg-[var(--brand-red)]/10";
          } else {
            cls += "border-[var(--border)] text-[var(--fg-dim)] opacity-60";
          }
          return (
            <button key={c.id} onClick={() => handleAnswer(c.id)} className={cls} disabled={revealed}>
              {c.title}
            </button>
          );
        })}
      </div>

      {revealed &&
        renderAfter?.({
          correct: selected === correctId,
          episodeId: correctId,
          correctTitle: round.correct.title,
        })}
    </div>
  );
}
