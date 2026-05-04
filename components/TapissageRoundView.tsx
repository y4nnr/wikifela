"use client";

import { useState } from "react";
import Image from "next/image";

export interface TapissageLineupMember {
  file: string;
  name: string;
  number: number;
}

export interface TapissageRound {
  question: string;
  subtitle: string;
  season: number | null;
  episode: number | null;
  episodeId: number;
  correctId?: number;
  lineup: TapissageLineupMember[];
  correctIndex: number;
}

interface TapissageRoundViewProps {
  round: TapissageRound;
  onAnswered: (info: { correct: boolean; episodeId: number; correctMemberIndex: number }) => void;
  renderAfter?: (info: {
    correct: boolean;
    episodeId: number;
    correctMemberIndex: number;
    selectedIndex: number;
  }) => React.ReactNode;
}

export default function TapissageRoundView({ round, onAnswered, renderAfter }: TapissageRoundViewProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  const handleSelect = (idx: number) => {
    if (revealed) return;
    setSelected(idx);
    setRevealed(true);
    onAnswered({
      correct: idx === round.correctIndex,
      episodeId: round.episodeId,
      correctMemberIndex: round.correctIndex,
    });
  };

  const lastQuestionWord = round.question.split(" ").pop()?.toLowerCase() || "";

  return (
    <div className="w-full max-w-2xl">
      <div className="border border-[var(--border)] rounded-lg bg-[var(--bg-card)] p-3 sm:p-6 mb-3">
        <div className="hidden sm:flex items-center gap-2 mb-4 pb-3 border-b border-[var(--border)]">
          <div className="w-2 h-2 rounded-full bg-[var(--brand-red)]" />
          <span className="text-[10px] font-mono text-[var(--fg-dim)] uppercase tracking-wider">
            Tapissage — Identification
          </span>
        </div>

        <p className="text-center text-base sm:text-lg font-semibold mb-1">
          Identifiez{" "}
          <span className="text-[var(--brand-red)]">{round.question}</span>
        </p>
        {round.subtitle && !round.subtitle.toLowerCase().includes(lastQuestionWord) ? (
          <p className="text-center text-xs sm:text-sm text-[var(--fg-muted)] mb-3 sm:mb-5 italic">
            {round.subtitle}
          </p>
        ) : round.season ? (
          <p className="text-center text-[10px] sm:text-xs text-[var(--fg-dim)] mb-3 sm:mb-5">
            Saison {round.season}, Épisode {round.episode}
          </p>
        ) : (
          <div className="mb-3 sm:mb-5" />
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          {round.lineup.map((member, idx) => {
            let borderColor = "border-[var(--border)]";
            let overlay = "";

            if (revealed) {
              if (idx === round.correctIndex) {
                borderColor = "border-[var(--success)]";
                overlay = "ring-2 ring-[var(--success)]";
              } else if (idx === selected) {
                borderColor = "border-[var(--brand-red)]";
                overlay = "ring-2 ring-[var(--brand-red)]";
              } else {
                overlay = "opacity-40";
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                disabled={revealed}
                className={`relative flex flex-col items-center rounded-lg border-2 ${borderColor} ${overlay} bg-[var(--bg)] p-1.5 sm:p-2 transition-all active:scale-95`}
              >
                <div className="relative w-full aspect-square sm:aspect-[3/4] mb-1 sm:mb-2 overflow-hidden rounded bg-[var(--bg-card)]">
                  <Image
                    src={member.file}
                    alt={`Suspect ${member.number}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 40vw, 150px"
                  />
                </div>

                <div className="w-full text-center py-0.5 sm:py-1 bg-[var(--bg-card)] border-t border-[var(--border)] rounded-b font-mono text-xs sm:text-sm font-bold text-[var(--fg)]">
                  {member.number}
                </div>
                {revealed && idx === selected && selected !== round.correctIndex && (
                  <p className="text-[9px] sm:text-[10px] text-[var(--fg-muted)] mt-0.5 text-center truncate w-full">
                    {member.name}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {revealed &&
        selected !== null &&
        renderAfter?.({
          correct: selected === round.correctIndex,
          episodeId: round.episodeId,
          correctMemberIndex: round.correctIndex,
          selectedIndex: selected,
        })}
    </div>
  );
}
