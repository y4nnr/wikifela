"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Crown, HelpCircle, Glasses, MapPin, ArrowRight } from "lucide-react";
import PageTitle from "@/components/PageTitle";
import Leaderboard from "@/components/Leaderboard";
import GameProcedureDiagram from "@/components/GameProcedureDiagram";
import QuizRoundView, { QuizQuestion } from "@/components/QuizRoundView";
import TapissageRoundView, { TapissageRound } from "@/components/TapissageRoundView";
import GeoFelaRoundView, { GeoCase, GeoFelaRound } from "@/components/GeoFelaRoundView";

type GameType = "quiz" | "tapissage" | "geofela";
type Phase = "setup" | "loading" | "playing" | "transition" | "gameover";

const GAME_ORDER: GameType[] = ["quiz", "tapissage", "geofela"];

const GAME_LABELS: Record<GameType, string> = {
  quiz: "Quiz",
  tapissage: "Tapissage",
  geofela: "GeoFELA",
};

const GAME_BADGES: Record<GameType, string> = {
  quiz: "QUIZ",
  tapissage: "TAPISSAGE",
  geofela: "GEOFELA",
};

function GameIcon({ type, size = 18 }: { type: GameType; size?: number }) {
  if (type === "quiz") return <HelpCircle size={size} strokeWidth={2} />;
  if (type === "tapissage") return <Glasses size={size} strokeWidth={2} />;
  return <MapPin size={size} strokeWidth={2} />;
}

interface QuizRoundData {
  type: "quiz";
  question: QuizQuestion;
}
interface TapRoundData {
  type: "tapissage";
  round: TapissageRound;
}
interface GeoRoundData {
  type: "geofela";
  round: GeoFelaRound;
}
type RoundData = QuizRoundData | TapRoundData | GeoRoundData;

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

const FEEDBACK_DELAY_CORRECT_MS = 500;
const FEEDBACK_DELAY_WRONG_MS = 1500;
const TRANSITION_VISIBLE_MS = 800;

export default function EnqueteClient() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [score, setScore] = useState(0);
  const [roundIndex, setRoundIndex] = useState(0);
  const [round, setRound] = useState<RoundData | null>(null);
  const [nextType, setNextType] = useState<GameType | null>(null);
  const [perfectRun, setPerfectRun] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const usedQuiz = useRef<Set<number>>(new Set());
  const usedTapissage = useRef<Set<number>>(new Set());
  const playedGeofela = useRef<Set<number>>(new Set());
  const geofelaPool = useRef<GeoCase[]>([]);
  const currentTypeRef = useRef<GameType | null>(null);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAdvanceTimer = () => {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearAdvanceTimer();
  }, []);

  const fetchRound = useCallback(async (type: GameType): Promise<RoundData | null> => {
    if (type === "quiz") {
      const exclude = Array.from(usedQuiz.current).join(",");
      const url = `/api/quiz?mode=survie&count=1${exclude ? `&exclude=${exclude}` : ""}`;
      const res = await fetch(url);
      const data = await res.json();
      const q = data.questions?.[0];
      if (!q) return null;
      if (typeof q.id === "number") usedQuiz.current.add(q.id);
      return { type: "quiz", question: q };
    }
    if (type === "tapissage") {
      const exclude = Array.from(usedTapissage.current).join(",");
      const url = `/api/tapissage?mode=survie&count=1${exclude ? `&excludeCorrect=${exclude}` : ""}`;
      const res = await fetch(url);
      const data = await res.json();
      const r = data.rounds?.[0];
      if (!r) return null;
      if (typeof r.correctId === "number") usedTapissage.current.add(r.correctId);
      return { type: "tapissage", round: r };
    }
    // geofela
    const available = geofelaPool.current.filter((c) => !playedGeofela.current.has(c.id));
    if (available.length === 0) return null;
    const correct = available[Math.floor(Math.random() * available.length)];
    playedGeofela.current.add(correct.id);
    const decoys = pickDecoys(correct, geofelaPool.current);
    const candidates = shuffle([correct, ...decoys]);
    return { type: "geofela", round: { correct, candidates } };
  }, []);

  const startGame = async () => {
    setError(null);
    clearAdvanceTimer();
    setPhase("loading");
    try {
      // Pre-fetch geofela pool (full list) if not already loaded
      if (geofelaPool.current.length === 0) {
        const res = await fetch("/api/geofela");
        const data = await res.json();
        geofelaPool.current = (data.cases || []) as GeoCase[];
      }
      if (geofelaPool.current.length < 4) {
        setError("Le jeu sera disponible prochainement (pas assez d'affaires éligibles).");
        setPhase("setup");
        return;
      }
    } catch {
      setError("Impossible de charger les données.");
      setPhase("setup");
      return;
    }

    usedQuiz.current = new Set();
    usedTapissage.current = new Set();
    playedGeofela.current = new Set();
    setScore(0);
    setRoundIndex(0);
    setPerfectRun(false);

    const first = GAME_ORDER[Math.floor(Math.random() * GAME_ORDER.length)];
    currentTypeRef.current = first;
    const r = await fetchRound(first);
    if (!r) {
      setError("Impossible de charger la première manche.");
      setPhase("setup");
      return;
    }
    setRound(r);
    setPhase("playing");
  };

  const handleAnswered = ({ correct }: { correct: boolean }) => {
    if (correct) {
      const newScore = score + 1;
      setScore(newScore);
      // After 500ms in-place feedback, switch to transition card
      clearAdvanceTimer();
      advanceTimerRef.current = setTimeout(async () => {
        const next = currentTypeRef.current
          ? GAME_ORDER[(GAME_ORDER.indexOf(currentTypeRef.current) + 1) % GAME_ORDER.length]
          : "quiz";
        setNextType(next);
        setPhase("transition");

        // Pre-fetch the next round while transition card is visible
        const nextRound = await fetchRound(next);

        // After TRANSITION_VISIBLE_MS, advance
        advanceTimerRef.current = setTimeout(() => {
          if (!nextRound) {
            setPerfectRun(true);
            setPhase("gameover");
            return;
          }
          currentTypeRef.current = next;
          setRound(nextRound);
          setRoundIndex((i) => i + 1);
          setPhase("playing");
        }, TRANSITION_VISIBLE_MS);
      }, FEEDBACK_DELAY_CORRECT_MS);
    } else {
      // Wrong: hold feedback briefly, then game over
      clearAdvanceTimer();
      advanceTimerRef.current = setTimeout(() => {
        setPhase("gameover");
      }, FEEDBACK_DELAY_WRONG_MS);
    }
  };

  // Keep ref in sync when phase changes via direct round set
  useEffect(() => {
    if (phase === "playing" && round) {
      currentTypeRef.current = round.type;
    }
  }, [phase, round]);

  // SETUP
  if (phase === "setup" || phase === "loading") {
    return (
      <div className="flex-1 flex flex-col items-center pb-6">
        <div className="w-full max-w-3xl">
          <PageTitle title="L'enquête" subtitle="Quiz, Tapissage et GeoFELA en Survie" />
        </div>

        <div className="w-full max-w-sm space-y-5 px-4">
          <GameProcedureDiagram
            title="Comment jouer"
            subtitle="Trois jeux qui s'enchaînent. Une erreur, et c'est terminé."
            visual={
              <div className="flex items-center justify-center gap-2 sm:gap-3 text-[var(--fg-dim)]">
                <HelpCircle size={32} strokeWidth={1.75} />
                <ArrowRight size={16} strokeWidth={2} />
                <Glasses size={32} strokeWidth={1.75} />
                <ArrowRight size={16} strokeWidth={2} />
                <MapPin size={32} strokeWidth={1.75} />
              </div>
            }
          />

          {error && (
            <p className="text-xs text-[var(--brand-red)] text-center">{error}</p>
          )}

          <button
            onClick={startGame}
            disabled={phase === "loading"}
            className="w-full py-3 rounded-lg bg-[var(--brand-red)] text-white font-semibold hover:bg-[var(--brand-red-hover)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Crown size={18} strokeWidth={2} />
            {phase === "loading" ? "Chargement…" : "Commencer"}
          </button>

          <div className="mt-2">
            <Leaderboard game="enquete" readOnly />
          </div>
        </div>
      </div>
    );
  }

  // GAMEOVER
  if (phase === "gameover") {
    const verdict = perfectRun
      ? "Vous avez complété toutes les épreuves de l'enquête !"
      : score >= 30
        ? "Légendaire !"
        : score >= 15
          ? "Imbattable !"
          : score >= 8
            ? "Impressionnant !"
            : score >= 3
              ? "Bien joué !"
              : "Encore un essai…";

    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-6">
        <div className="text-center max-w-sm w-full">
          <div className="border border-[var(--border)] rounded-lg bg-[var(--bg-card)] p-5 sm:p-6 mb-4">
            <div className="text-[10px] text-[var(--fg-dim)] uppercase tracking-wider mb-4">
              {perfectRun ? "Parcours parfait" : "Fin de la série"}
            </div>
            <div className="text-4xl sm:text-5xl font-bold mb-2 text-[var(--brand-red)]">{score}</div>
            <p className="text-sm text-[var(--fg-muted)] mb-1">
              bonne{score !== 1 ? "s " : " "}réponse{score !== 1 ? "s " : " "}d&apos;affilée
            </p>
            <p className="text-base sm:text-lg text-[var(--fg)] mt-3">{verdict}</p>
          </div>

          <div className="mb-4">
            <Leaderboard game="enquete" playerScore={score} />
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

  // TRANSITION CARD — between rounds, only after correct answer
  if (phase === "transition" && nextType) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm border border-[var(--border)] rounded-lg bg-[var(--bg-card)] p-6 text-center">
          <div className="text-base sm:text-lg text-[var(--success)] font-semibold mb-3">✓ Bravo !</div>
          <div className="mb-5">
            <div className="text-[10px] text-[var(--fg-dim)] uppercase tracking-wider mb-1">Score</div>
            <div className="text-5xl font-bold inline-block enquete-score-pop">{score}</div>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-[var(--fg-muted)]">
            <span>Prochain :</span>
            <span className="text-[var(--fg)]">
              <GameIcon type={nextType} size={16} />
            </span>
            <span className="text-[var(--fg)] font-medium">{GAME_LABELS[nextType]}</span>
          </div>
        </div>
      </div>
    );
  }

  // PLAYING
  if (phase === "playing" && round) {
    const currentType = round.type;

    return (
      <div className="flex-1 flex flex-col items-center px-3 sm:px-4 pt-3 sm:pt-4 pb-4">
        <div className="w-full max-w-3xl mb-3">
          <div className="flex justify-between items-center text-[10px] sm:text-xs text-[var(--fg-dim)] mb-1.5">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--brand-red)] animate-pulse" />
              L&apos;enquête · Série : {score}
            </span>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-[var(--border)] text-[var(--fg-muted)] font-mono text-[10px]">
              <GameIcon type={currentType} size={12} />
              {GAME_BADGES[currentType]}
            </span>
          </div>
        </div>

        <div className="w-full flex flex-col items-center">
          {round.type === "quiz" && (
            <QuizRoundView
              key={`q-${roundIndex}`}
              question={round.question}
              onAnswered={handleAnswered}
            />
          )}
          {round.type === "tapissage" && (
            <TapissageRoundView
              key={`t-${roundIndex}`}
              round={round.round}
              onAnswered={handleAnswered}
            />
          )}
          {round.type === "geofela" && (
            <GeoFelaRoundView
              key={`g-${roundIndex}-${round.round.correct.id}`}
              round={round.round}
              hardMode={false}
              mapHeight="min(40vh, 320px)"
              onAnswered={handleAnswered}
            />
          )}
        </div>
      </div>
    );
  }

  return null;
}
