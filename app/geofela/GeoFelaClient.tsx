"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import PageTitle from "@/components/PageTitle";
import Leaderboard from "@/components/Leaderboard";
import GeoFelaRoundView, { GeoCase, GeoFelaRound } from "@/components/GeoFelaRoundView";
import GameProcedureDiagram from "@/components/GameProcedureDiagram";

type Mode = "classique" | "survie";
type Difficulty = "easy" | "hard";
type Phase = "setup" | "playing" | "result" | "error";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickDecoys(correct: GeoCase, pool: GeoCase[]): GeoCase[] {
  const correctDepts = new Set(correct.locations.map((l) => l.department));
  const others = pool.filter((c) => c.id !== correct.id);
  const sameDept = others.filter((c) =>
    c.locations.some((l) => correctDepts.has(l.department))
  );
  const remaining = others.filter((c) => !sameDept.includes(c));

  const decoys: GeoCase[] = [];
  for (const c of shuffle(sameDept)) {
    if (decoys.length >= 3) break;
    decoys.push(c);
  }
  for (const c of shuffle(remaining)) {
    if (decoys.length >= 3) break;
    decoys.push(c);
  }
  return decoys.slice(0, 3);
}

export default function GeoFelaClient() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [mode, setMode] = useState<Mode>("survie");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [count, setCount] = useState(5);

  const [pool, setPool] = useState<GeoCase[]>([]);
  const [poolLoading, setPoolLoading] = useState(true);
  const [poolError, setPoolError] = useState<string | null>(null);

  const playedIds = useRef<Set<number>>(new Set());
  const [round, setRound] = useState<GeoFelaRound | null>(null);
  const [roundIndex, setRoundIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [survieOver, setSurvieOver] = useState(false);
  const [advanceReady, setAdvanceReady] = useState(false);

  const effectiveDifficulty: Difficulty = mode === "survie" ? "easy" : difficulty;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPoolLoading(true);
      setPoolError(null);
      try {
        const res = await fetch("/api/geofela");
        if (!res.ok) throw new Error("fetch failed");
        const data = await res.json();
        if (cancelled) return;
        const cases: GeoCase[] = data.cases || [];
        if (cases.length < 4) {
          setPoolError("Le jeu sera disponible prochainement (pas assez d'affaires éligibles).");
        }
        setPool(cases);
      } catch {
        if (!cancelled) setPoolError("Impossible de charger les affaires.");
      } finally {
        if (!cancelled) setPoolLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const startNewRound = useCallback((currentPool: GeoCase[]): GeoFelaRound | null => {
    const available = currentPool.filter((c) => !playedIds.current.has(c.id));
    const usable = available.length > 0 ? available : currentPool;
    if (usable.length === 0) return null;
    const correct = usable[Math.floor(Math.random() * usable.length)];
    playedIds.current.add(correct.id);
    const decoys = pickDecoys(correct, currentPool);
    const candidates = shuffle([correct, ...decoys]);
    return { correct, candidates };
  }, []);

  const startGame = () => {
    if (pool.length < 4) return;
    playedIds.current = new Set();
    setRoundIndex(0);
    setScore(0);
    setSurvieOver(false);
    setAdvanceReady(false);
    const r = startNewRound(pool);
    if (!r) return;
    setRound(r);
    setPhase("playing");
  };

  const handleAnswered = ({ correct }: { correct: boolean }) => {
    if (correct) {
      setScore((s) => s + 1);
    } else if (mode === "survie") {
      setSurvieOver(true);
    }
    setAdvanceReady(true);
  };

  const nextRound = () => {
    if (mode === "survie" && survieOver) {
      setPhase("result");
      return;
    }
    if (mode === "classique" && roundIndex + 1 >= count) {
      setPhase("result");
      return;
    }
    const r = startNewRound(pool);
    if (!r) {
      setPhase("result");
      return;
    }
    setRound(r);
    setRoundIndex((i) => i + 1);
    setAdvanceReady(false);
  };

  if (poolLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-[var(--fg-dim)]">Chargement…</p>
      </div>
    );
  }

  if (poolError) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <p className="text-sm text-[var(--fg-muted)]">{poolError}</p>
        </div>
      </div>
    );
  }

  if (phase === "setup") {
    return (
      <div className="flex-1 flex flex-col items-center pb-6">
        <div className="w-full max-w-3xl">
          <PageTitle title="GeoFELA" subtitle="Reconnaissez l'affaire à partir de ses lieux" />
        </div>

        <div className="w-full max-w-sm space-y-6 px-4">
          <GameProcedureDiagram
            title="Comment jouer"
            subtitle="4 affaires — 1 à identifier d'après les lieux"
          />

          <div>
            <label className="block text-sm text-[var(--fg-muted)] mb-3">Mode</label>
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
                  {m === "classique" ? "Sur mesure" : "Survie"}
                </button>
              ))}
            </div>
            {mode === "survie" && (
              <p className="text-[10px] text-[var(--fg-dim)] mt-2">
                La partie s&apos;arrête à la première erreur. Difficulté facile, infini.
              </p>
            )}
          </div>

          {mode === "classique" && (
            <>
              <div>
                <label className="block text-sm text-[var(--fg-muted)] mb-3">Difficulté</label>
                <div className="flex gap-3">
                  {([
                    { key: "easy", label: "Facile" },
                    { key: "hard", label: "Difficile" },
                  ] as { key: Difficulty; label: string }[]).map((d) => (
                    <button
                      key={d.key}
                      onClick={() => setDifficulty(d.key)}
                      className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                        difficulty === d.key
                          ? d.key === "hard"
                            ? "border-[var(--brand-red)] text-[var(--brand-red)] bg-[var(--brand-red)]/5"
                            : "border-[var(--success)] text-[var(--success)] bg-white/5"
                          : "border-[var(--border)] text-[var(--fg-dim)] hover:border-[var(--border-hover)]"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-[var(--fg-dim)] mt-2">
                  {difficulty === "easy"
                    ? "Pin clic : ville, département, catégorie, date, description."
                    : "Pin clic : ville, département, catégorie uniquement."}
                </p>
              </div>

              <div>
                <label className="block text-sm text-[var(--fg-muted)] mb-3">Nombre de manches</label>
                <div className="flex gap-3">
                  {[3, 5, 8].map((n) => (
                    <button
                      key={n}
                      onClick={() => setCount(n)}
                      className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                        count === n
                          ? "border-[var(--accent)] text-[var(--accent)] bg-white/5"
                          : "border-[var(--border)] text-[var(--fg-dim)] hover:border-[var(--border-hover)]"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <button
            onClick={startGame}
            className="w-full py-3 rounded-lg bg-[var(--brand-red)] text-white font-semibold hover:bg-[var(--brand-red-hover)] transition-colors"
          >
            Commencer
          </button>

          {mode === "survie" && (
            <div className="mt-2">
              <Leaderboard game="geofela" readOnly />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (phase === "playing" && round) {
    return (
      <div className="flex-1 flex flex-col items-center px-3 sm:px-4 pt-3 sm:pt-4 pb-4">
        <div className="w-full max-w-3xl mb-3">
          <div className="flex justify-between text-[10px] sm:text-xs text-[var(--fg-dim)] mb-1.5">
            {mode === "survie" ? (
              <>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--brand-red)] animate-pulse" />
                  Survie
                </span>
                <span>Série : {score}</span>
              </>
            ) : (
              <>
                <span>{roundIndex + 1} / {count}</span>
                <span>{score} correcte{score !== 1 ? "s" : ""}</span>
              </>
            )}
          </div>
          {mode === "classique" && (
            <div className="w-full h-1 bg-[var(--border)] rounded-full">
              <div
                className="h-1 bg-[var(--brand-red)] rounded-full transition-all"
                style={{ width: `${((roundIndex + 1) / count) * 100}%` }}
              />
            </div>
          )}
        </div>

        <GeoFelaRoundView
          key={`geofela-${roundIndex}-${round.correct.id}`}
          round={round}
          hardMode={effectiveDifficulty === "hard"}
          onAnswered={handleAnswered}
          renderAfter={({ correct, episodeId, correctTitle }) => (
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <div className="flex items-center gap-3 flex-wrap">
                {correct ? (
                  <span className="text-[var(--success)] text-sm font-medium">
                    ✓ Bravo ! C&apos;est bien {correctTitle}.
                  </span>
                ) : (
                  <span className="text-[var(--brand-red)] text-sm font-medium">
                    ✗ Il s&apos;agissait de {correctTitle}.
                  </span>
                )}
                <Link
                  href={`/episode/${episodeId}`}
                  className="text-xs text-[var(--fg-dim)] hover:text-[var(--brand-red)] transition-colors"
                >
                  Voir l&apos;épisode →
                </Link>
              </div>
              <button
                onClick={nextRound}
                disabled={!advanceReady}
                className="w-full sm:w-auto px-6 py-2.5 sm:py-2 rounded-lg bg-[var(--brand-red)] text-white text-sm font-semibold hover:bg-[var(--brand-red-hover)] transition-colors"
              >
                {mode === "survie" && survieOver
                  ? "Voir le résultat"
                  : mode === "classique" && roundIndex + 1 >= count
                    ? "Voir le résultat →"
                    : "Suivant →"}
              </button>
            </div>
          )}
        />
      </div>
    );
  }

  if (mode === "survie") {
    const verdict =
      score >= 15 ? "Maître géographe !" : score >= 8 ? "Impressionnant !" : score >= 4 ? "Bien joué !" : score >= 1 ? "Pas mal !" : "Encore un essai…";

    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-sm w-full">
          <div className="border border-[var(--border)] rounded-lg bg-[var(--bg-card)] p-5 sm:p-6 mb-4">
            <div className="text-[10px] text-[var(--fg-dim)] uppercase tracking-wider mb-4">Fin de la série</div>
            <div className="text-4xl sm:text-5xl font-bold mb-2 text-[var(--brand-red)]">{score}</div>
            <p className="text-sm text-[var(--fg-muted)] mb-1">
              affaire{score !== 1 ? "s " : " "}reconnue{score !== 1 ? "s " : " "}d&apos;affilée
            </p>
            <p className="text-base sm:text-lg text-[var(--fg)] mt-3">{verdict}</p>
          </div>

          <div className="mb-4">
            <Leaderboard game="geofela" playerScore={score} />
          </div>

          <button
            onClick={() => setPhase("setup")}
            className="w-full py-3 rounded-lg bg-[var(--brand-red)] text-white font-semibold hover:bg-[var(--brand-red-hover)] transition-colors"
          >
            Rejouer
          </button>
        </div>
      </div>
    );
  }

  const total = count;
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  const verdict = percentage === 100 ? "Maître géographe !" : percentage >= 70 ? "Bien joué !" : percentage >= 40 ? "Pas mal !" : "À revoir…";

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-sm w-full">
        <div className="border border-[var(--border)] rounded-lg bg-[var(--bg-card)] p-5 sm:p-6 mb-6">
          <div className="text-[10px] text-[var(--fg-dim)] uppercase tracking-wider mb-4">Résultat</div>
          <div className="text-4xl sm:text-5xl font-bold mb-2">
            <span className={percentage >= 50 ? "text-[var(--success)]" : "text-[var(--brand-red)]"}>{score}</span>
            <span className="text-[var(--fg-dim)]">/{total}</span>
          </div>
          <p className="text-base sm:text-lg text-[var(--fg)] mb-1">{verdict}</p>
          <p className="text-sm text-[var(--fg-dim)]">{percentage}% de bonnes réponses</p>
        </div>

        <button
          onClick={() => setPhase("setup")}
          className="w-full py-3 rounded-lg bg-[var(--brand-red)] text-white font-semibold hover:bg-[var(--brand-red-hover)] transition-colors"
        >
          Rejouer
        </button>
      </div>
    </div>
  );
}
