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

type Mode = "classique" | "survie";
type Phase = "setup" | "playing" | "result";

export default function TapissageClient() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [mode, setMode] = useState<Mode>("classique");
  const [count, setCount] = useState(5);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [survieOver, setSurvieOver] = useState(false);

  const start = useCallback(async () => {
    setLoading(true);
    try {
      const fetchCount = mode === "survie" ? 100 : count;
      const res = await fetch(`/api/tapissage?count=${fetchCount}&mode=${mode}`);
      const data = await res.json();
      if (data.rounds?.length > 0) {
        setRounds(data.rounds);
        setCurrentIndex(0);
        setSelected(null);
        setRevealed(false);
        setScore(0);
        setSurvieOver(false);
        setPhase("playing");
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [count, mode]);

  const handleSelect = (idx: number) => {
    if (revealed) return;
    setSelected(idx);
    setRevealed(true);
    if (idx === rounds[currentIndex].correctIndex) {
      setScore((s) => s + 1);
    } else if (mode === "survie") {
      setSurvieOver(true);
    }
  };

  const next = () => {
    if (mode === "survie" && survieOver) {
      setPhase("result");
      return;
    }
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
          <div className="border border-[var(--border)] rounded bg-[var(--bg-card)] p-4 text-center">
            <div className="text-[10px] text-[var(--fg-dim)] uppercase tracking-wider mb-3">
              Procédure de tapissage
            </div>
            <div className="flex justify-center gap-2 sm:gap-3 mb-3">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="w-10 h-12 sm:w-12 sm:h-14 border border-[var(--border)] rounded bg-[var(--bg)] flex items-end justify-center pb-1"
                >
                  <span className="text-[10px] text-[var(--fg-dim)]">{n}</span>
                </div>
              ))}
            </div>
            <div className="text-[10px] text-[var(--fg-dim)]">
              4 suspects — 1 accusé à identifier
            </div>
          </div>

          <div>
            <label className="block text-sm text-[var(--fg-muted)] mb-3">
              Mode
            </label>
            <div className="flex gap-3">
              {(["classique", "survie"] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    mode === m
                      ? m === "survie"
                        ? "border-[var(--brand-red)] text-[var(--brand-red)] bg-[var(--brand-red)]/5"
                        : "border-[var(--accent)] text-[var(--accent)] bg-white/5"
                      : "border-[var(--border)] text-[var(--fg-dim)] hover:border-[var(--border-hover)]"
                  }`}
                >
                  {m === "classique" ? "Classique" : "Survie"}
                </button>
              ))}
            </div>
            {mode === "survie" && (
              <p className="text-[10px] text-[var(--fg-dim)] mt-2">
                La partie s&apos;arrête à la première erreur. Tenez le plus longtemps possible.
              </p>
            )}
          </div>

          {mode === "classique" && (
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
          )}

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
      <div className="flex-1 flex flex-col items-center px-3 sm:px-4 pt-3 sm:pt-4">
        {/* Progress */}
        <div className="w-full max-w-2xl mb-3">
          <div className="flex justify-between text-[10px] sm:text-xs text-[var(--fg-dim)] mb-1.5">
            {mode === "survie" ? (
              <>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--brand-red)] animate-pulse" />
                  Survie
                </span>
                <span>
                  Série : {score}
                </span>
              </>
            ) : (
              <>
                <span>
                  {currentIndex + 1} / {rounds.length}
                </span>
                <span>
                  {score} correcte{score !== 1 ? "s" : ""}
                </span>
              </>
            )}
          </div>
          {mode === "classique" && (
            <div className="w-full h-1 bg-[var(--border)] rounded-full">
              <div
                className="h-1 bg-[var(--brand-red)] rounded-full transition-all"
                style={{
                  width: `${((currentIndex + 1) / rounds.length) * 100}%`,
                }}
              />
            </div>
          )}
        </div>

        {/* Question */}
        <div className="w-full max-w-2xl">
          <div className="border border-[var(--border)] rounded-lg bg-[var(--bg-card)] p-3 sm:p-6 mb-3">
            {/* Police header — hidden on very small screens */}
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
            {round.subtitle && !round.subtitle.toLowerCase().includes(round.question.split(' ').pop()?.toLowerCase() || '') ? (
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

            {/* Lineup — 2x2 grid on mobile, 4 across on desktop */}
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

                    {/* Number plate */}
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

          {/* Actions — stacked on mobile */}
          {revealed && (
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
              <div className="flex items-center gap-2">
                {selected === round.correctIndex ? (
                  <span className="text-[var(--success)] text-sm font-medium">
                    {mode === "survie" ? `✓ Série : ${score}` : "✓ Bonne identification"}
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
                className="w-full sm:w-auto px-6 py-2.5 sm:py-2 rounded-lg bg-[var(--brand-red)] text-white text-sm font-semibold hover:bg-[var(--brand-red-hover)] transition-colors"
              >
                {mode === "survie" && survieOver
                  ? "Voir le résultat"
                  : currentIndex + 1 >= rounds.length
                    ? "Voir le résultat →"
                    : "Suivant →"}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // RESULT — Survie mode
  if (mode === "survie") {
    const streakVerdict =
      score >= 20
        ? "Imbattable !"
        : score >= 10
          ? "Impressionnant !"
          : score >= 5
            ? "Bien joué !"
            : score >= 2
              ? "Pas mal !"
              : "Retour à l'école de police...";

    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-sm w-full">
          <div className="border border-[var(--border)] rounded-lg bg-[var(--bg-card)] p-5 sm:p-6 mb-6">
            <div className="text-[10px] text-[var(--fg-dim)] uppercase tracking-wider mb-4">
              Fin de la série
            </div>
            <div className="text-4xl sm:text-5xl font-bold mb-2 text-[var(--brand-red)]">
              {score}
            </div>
            <p className="text-sm text-[var(--fg-muted)] mb-1">
              identification{score !== 1 ? "s" : ""} correcte{score !== 1 ? "s" : ""} d&apos;affilée
            </p>
            <p className="text-base sm:text-lg text-[var(--fg)] mt-3">{streakVerdict}</p>
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

  // RESULT — Classique mode
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
      <div className="text-center max-w-sm w-full">
        <div className="border border-[var(--border)] rounded-lg bg-[var(--bg-card)] p-5 sm:p-6 mb-6">
          <div className="text-[10px] text-[var(--fg-dim)] uppercase tracking-wider mb-4">
            Résultat du tapissage
          </div>
          <div className="text-4xl sm:text-5xl font-bold mb-2">
            <span
              className={
                percentage >= 50 ? "text-[var(--success)]" : "text-[var(--brand-red)]"
              }
            >
              {score}
            </span>
            <span className="text-[var(--fg-dim)]">/{rounds.length}</span>
          </div>
          <p className="text-base sm:text-lg text-[var(--fg)] mb-1">{verdict}</p>
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
