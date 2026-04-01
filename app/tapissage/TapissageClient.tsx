"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import PageTitle from "@/components/PageTitle";

interface LineupMember {
  file: string;
  name: string;
  number: number;
}

interface Round {
  question: string;
  subtitle: string;
  season: number | null;
  episode: number | null;
  episodeId: number;
  lineup: LineupMember[];
  correctIndex: number;
}

type Phase = "setup" | "playing" | "result";

export default function TapissageClient() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [count, setCount] = useState(5);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);

  const start = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tapissage?count=${count}`);
      const data = await res.json();
      if (data.rounds?.length > 0) {
        setRounds(data.rounds);
        setCurrentIndex(0);
        setSelected(null);
        setRevealed(false);
        setScore(0);
        setPhase("playing");
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [count]);

  const handleSelect = (idx: number) => {
    if (revealed) return;
    setSelected(idx);
    setRevealed(true);
    if (idx === rounds[currentIndex].correctIndex) {
      setScore((s) => s + 1);
    }
  };

  const next = () => {
    if (currentIndex + 1 >= rounds.length) {
      setPhase("result");
    } else {
      setCurrentIndex((i) => i + 1);
      setSelected(null);
      setRevealed(false);
    }
  };

  // SETUP
  if (phase === "setup") {
    return (
      <div className="flex-1 flex flex-col items-center">
        <div className="w-full max-w-3xl">
          <PageTitle
            title="Tapissage"
            subtitle="Identifiez l'accusé parmi les suspects"
          />
        </div>

        <div className="w-full max-w-sm space-y-6 px-4">
          {/* Police lineup illustration */}
          <div className="border border-[var(--border)] rounded bg-[var(--bg-card)] p-4 text-center">
            <div className="text-[10px] text-[var(--fg-dim)] uppercase tracking-widest mb-3">
              Procédure de tapissage
            </div>
            <div className="flex justify-center gap-3 mb-3">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="w-12 h-14 border border-[var(--border)] rounded bg-[var(--bg)] flex items-end justify-center pb-1"
                >
                  <span className="text-[10px] text-[var(--fg-dim)]">
                    {n}
                  </span>
                </div>
              ))}
            </div>
            <div className="text-[10px] text-[var(--fg-dim)]">
              4 suspects — 1 accusé à identifier
            </div>
          </div>

          <div>
            <label className="block text-sm text-[var(--fg-muted)] mb-3">
              Nombre de tapissages
            </label>
            <div className="flex gap-3">
              {[3, 5, 8].map((n) => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    count === n
                      ? "border-[var(--brand-red)] text-[var(--brand-red)] bg-[var(--brand-red)]/5"
                      : "border-[var(--border)] text-[var(--fg-dim)] hover:border-[var(--border-hover)]"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={start}
            disabled={loading}
            className="w-full py-3 rounded-lg bg-[var(--brand-red)] text-white font-semibold hover:bg-[var(--brand-red-hover)] transition-colors disabled:opacity-50"
          >
            {loading ? "Chargement..." : "Commencer le tapissage"}
          </button>
        </div>
      </div>
    );
  }

  // PLAYING
  if (phase === "playing") {
    const round = rounds[currentIndex];
    return (
      <div className="flex-1 flex flex-col items-center px-4 pt-4">
        {/* Progress */}
        <div className="w-full max-w-2xl mb-4">
          <div className="flex justify-between text-xs text-[var(--fg-dim)] mb-2">
            <span>
              Tapissage {currentIndex + 1} / {rounds.length}
            </span>
            <span>
              {score} identification{score !== 1 ? "s" : ""} correcte
              {score !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="w-full h-1 bg-[var(--border)] rounded-full">
            <div
              className="h-1 bg-[var(--brand-red)] rounded-full transition-all"
              style={{
                width: `${((currentIndex + 1) / rounds.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="w-full max-w-2xl">
          <div className="border border-[var(--border)] rounded-lg bg-[var(--bg-card)] p-4 sm:p-6 mb-4">
            {/* Police header */}
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[var(--border)]">
              <div className="w-2 h-2 rounded-full bg-[var(--brand-red)]" />
              <span className="text-[10px] font-mono text-[var(--fg-dim)] uppercase tracking-widest">
                Tapissage — Identification de suspect
              </span>
            </div>

            <p className="text-center text-lg font-semibold mb-1">
              Identifiez{" "}
              <span className="text-[var(--brand-red)]">{round.question}</span>
            </p>
            {round.subtitle && !round.subtitle.toLowerCase().includes(round.question.split(' ').pop()?.toLowerCase() || '') ? (
              <p className="text-center text-sm text-[var(--fg-muted)] mb-5 italic">
                {round.subtitle}
              </p>
            ) : round.season ? (
              <p className="text-center text-xs text-[var(--fg-dim)] mb-5">
                Saison {round.season}, Épisode {round.episode}
              </p>
            ) : (
              <div className="mb-5" />
            )}

            {/* Lineup */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
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
                } else if (idx === selected) {
                  borderColor = "border-[var(--accent)]";
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelect(idx)}
                    className={`relative flex flex-col items-center rounded-lg border-2 ${borderColor} ${overlay} bg-[var(--bg)] p-2 transition-all hover:border-[var(--border-hover)]`}
                  >
                    {/* Height measurement lines */}
                    <div className="absolute top-0 right-1 h-full flex flex-col justify-between py-2 opacity-20">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className="w-2 border-t border-[var(--fg-dim)]"
                        />
                      ))}
                    </div>

                    <div className="relative w-full aspect-[3/4] mb-2 overflow-hidden rounded bg-[var(--bg-card)]">
                      <Image
                        src={member.file}
                        alt={`Suspect ${member.number}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 40vw, 150px"
                      />
                    </div>

                    {/* Number plate */}
                    <div className="w-full text-center py-1 bg-[var(--bg-card)] border-t border-[var(--border)] rounded-b font-mono text-sm font-bold text-[var(--fg)]">
                      {member.number}
                    </div>
                    {revealed && idx === selected && selected !== round.correctIndex && (
                      <p className="text-[10px] text-[var(--fg-muted)] mt-1 text-center truncate w-full">
                        {member.name}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {revealed && (
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                {selected === round.correctIndex ? (
                  <span className="text-[var(--success)] text-sm font-medium">
                    ✓ Bonne identification
                  </span>
                ) : (
                  <span className="text-[var(--brand-red)] text-sm font-medium">
                    ✗ C&apos;était le n°{round.correctIndex + 1}
                  </span>
                )}
                <Link
                  href={`/episode/${round.episodeId}`}
                  className="text-xs text-[var(--fg-dim)] hover:text-[var(--brand-red)] transition-colors"
                >
                  Voir l&apos;affaire
                </Link>
              </div>
              <button
                onClick={next}
                className="px-6 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border)] text-sm hover:border-[var(--border-hover)] transition-colors"
              >
                {currentIndex + 1 >= rounds.length
                  ? "Voir le résultat"
                  : "Tapissage suivant"}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // RESULT
  const percentage = Math.round((score / rounds.length) * 100);
  const verdict =
    percentage === 100
      ? "Enquêteur d'élite !"
      : percentage >= 70
        ? "Bon enquêteur !"
        : percentage >= 40
          ? "Enquêteur en formation"
          : "Retour à l'école de police...";

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="border border-[var(--border)] rounded-lg bg-[var(--bg-card)] p-6 mb-6">
          <div className="text-[10px] text-[var(--fg-dim)] uppercase tracking-widest mb-4">
            Résultat du tapissage
          </div>
          <div className="text-5xl font-bold mb-2">
            <span
              className={
                percentage >= 50 ? "text-[var(--success)]" : "text-[var(--brand-red)]"
              }
            >
              {score}
            </span>
            <span className="text-[var(--fg-dim)]">/{rounds.length}</span>
          </div>
          <p className="text-lg text-[var(--fg)] mb-1">{verdict}</p>
          <p className="text-sm text-[var(--fg-dim)]">
            {percentage}% d&apos;identifications correctes
          </p>
        </div>

        <button
          onClick={() => {
            setPhase("setup");
            setRounds([]);
          }}
          className="w-full py-3 rounded-lg bg-[var(--brand-red)] text-white font-semibold hover:bg-[var(--brand-red-hover)] transition-colors"
        >
          Nouveau tapissage
        </button>
      </div>
    </div>
  );
}
