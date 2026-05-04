"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import PageTitle from "@/components/PageTitle";
import Leaderboard from "@/components/Leaderboard";
import QuizRoundView, { QuizQuestion } from "@/components/QuizRoundView";

type Difficulty = "facile" | "moyen" | "difficile";
type Mode = "classique" | "survie";
type Phase = "setup" | "playing" | "result";

export default function QuizClient() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [difficulty, setDifficulty] = useState<Difficulty>("facile");
  const [mode, setMode] = useState<Mode>("classique");
  const [count, setCount] = useState(5);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [survieOver, setSurvieOver] = useState(false);
  const [advanceReady, setAdvanceReady] = useState(false);

  const startQuiz = useCallback(async () => {
    setLoading(true);
    try {
      const fetchCount = mode === "survie" ? 100 : count;
      const url =
        mode === "survie"
          ? `/api/quiz?count=${fetchCount}&mode=survie`
          : `/api/quiz?difficulty=${difficulty}&count=${fetchCount}&mode=classique`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.questions?.length > 0) {
        setQuestions(data.questions);
        setCurrentIndex(0);
        setScore(0);
        setSurvieOver(false);
        setAdvanceReady(false);
        setPhase("playing");
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [difficulty, count, mode]);

  const handleAnswered = ({ correct }: { correct: boolean; episodeId: number | null }) => {
    if (correct) {
      setScore((s) => s + 1);
    } else if (mode === "survie") {
      setSurvieOver(true);
    }
    setAdvanceReady(true);
  };

  const nextQuestion = () => {
    if (mode === "survie" && survieOver) {
      setPhase("result");
      return;
    }
    if (currentIndex + 1 >= questions.length) {
      setPhase("result");
    } else {
      setCurrentIndex((i) => i + 1);
      setAdvanceReady(false);
    }
  };

  const difficultyColors: Record<Difficulty, string> = {
    facile: "border-[var(--success-dim)] text-[var(--success)]",
    moyen: "border-[var(--brand-orange)] text-[var(--brand-orange)]",
    difficile: "border-[var(--brand-red)] text-[var(--brand-red)]",
  };

  // SETUP
  if (phase === "setup") {
    return (
      <div className="flex-1 flex flex-col items-center">
        <div className="w-full max-w-3xl">
          <PageTitle title="Quiz" subtitle="Testez vos connaissances sur les affaires" />
        </div>

        <div className="w-full max-w-sm space-y-6 px-4">
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
              <label className="block text-sm text-[var(--fg-muted)] mb-3">Difficulté</label>
              <div className="flex gap-3">
                {(["facile", "moyen", "difficile"] as Difficulty[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`flex-1 py-2.5 rounded-lg border text-sm font-medium capitalize transition-all ${
                      difficulty === d
                        ? `${difficultyColors[d]} bg-white/5`
                        : "border-[var(--border)] text-[var(--fg-dim)] hover:border-[var(--border-hover)]"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === "classique" && (
            <div>
              <label className="block text-sm text-[var(--fg-muted)] mb-3">Nombre de questions</label>
              <div className="flex gap-3">
                {[3, 5, 10].map((n) => (
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
          )}

          <button
            onClick={startQuiz}
            disabled={loading}
            className="w-full py-3 rounded-lg bg-[var(--brand-red)] text-white font-semibold hover:bg-[var(--brand-red-hover)] transition-colors disabled:opacity-50 mt-4"
          >
            {loading ? "Chargement..." : "Commencer"}
          </button>

          {mode === "survie" && (
            <div className="mt-2">
              <Leaderboard game="quiz" readOnly />
            </div>
          )}
        </div>
      </div>
    );
  }

  // PLAYING
  if (phase === "playing") {
    const q = questions[currentIndex];
    return (
      <div className="flex-1 flex flex-col items-center px-4 pt-8">
        <div className="w-full max-w-lg mb-6">
          <div className="flex justify-between text-xs text-[var(--fg-dim)] mb-2">
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
                <span>Question {currentIndex + 1} / {questions.length}</span>
                <span>
                  {score} bonne{score !== 1 ? "s" : ""} réponse
                  {score !== 1 ? "s" : ""}
                </span>
              </>
            )}
          </div>
          {mode === "classique" && (
            <div className="w-full h-1 bg-[var(--border)] rounded-full">
              <div
                className="h-1 bg-[var(--brand-red)] rounded-full transition-all"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          )}
        </div>

        <QuizRoundView
          key={currentIndex}
          question={q}
          onAnswered={handleAnswered}
          renderAfter={({ episodeId }) => (
            <div className="mt-6 flex justify-between items-center">
              {episodeId ? (
                <Link
                  href={`/episode/${episodeId}`}
                  className="text-xs text-[var(--fg-dim)] hover:text-[var(--brand-red)] transition-colors"
                >
                  Voir l&apos;épisode
                </Link>
              ) : (
                <span />
              )}
              <button
                onClick={nextQuestion}
                disabled={!advanceReady}
                className="px-6 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border)] text-sm hover:border-[var(--border-hover)] transition-colors"
              >
                {mode === "survie" && survieOver
                  ? "Voir le résultat"
                  : currentIndex + 1 >= questions.length
                    ? "Voir le résultat"
                    : "Question suivante"}
              </button>
            </div>
          )}
        />
      </div>
    );
  }

  // RESULT
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
              : "À revoir...";

    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-sm w-full">
          <div className="border border-[var(--border)] rounded-lg bg-[var(--bg-card)] p-5 sm:p-6 mb-4">
            <div className="text-[10px] text-[var(--fg-dim)] uppercase tracking-wider mb-4">Fin de la série</div>
            <div className="text-4xl sm:text-5xl font-bold mb-2 text-[var(--brand-red)]">{score}</div>
            <p className="text-sm text-[var(--fg-muted)] mb-1">
              bonne{score !== 1 ? "s " : " "}réponse{score !== 1 ? "s " : " "}d&apos;affilée
            </p>
            <p className="text-base sm:text-lg text-[var(--fg)] mt-3">{streakVerdict}</p>
          </div>

          <div className="mb-4">
            <Leaderboard game="quiz" playerScore={score} />
          </div>

          <button
            onClick={() => {
              setPhase("setup");
              setQuestions([]);
            }}
            className="w-full py-3 rounded-lg bg-[var(--brand-red)] text-white font-semibold hover:bg-[var(--brand-red-hover)] transition-colors"
          >
            Rejouer
          </button>
        </div>
      </div>
    );
  }

  const percentage = Math.round((score / questions.length) * 100);
  const emoji =
    percentage === 100
      ? "Parfait !"
      : percentage >= 70
        ? "Bien joué !"
        : percentage >= 40
          ? "Pas mal !"
          : "À revoir...";

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="text-6xl font-bold mb-2">
          <span className={percentage >= 50 ? "text-[var(--success)]" : "text-[var(--brand-red)]"}>{score}</span>
          <span className="text-[var(--fg-dim)]">/{questions.length}</span>
        </div>
        <p className="text-xl text-[var(--fg-muted)] mb-2">{emoji}</p>
        <p className="text-sm text-[var(--fg-dim)] mb-8">{percentage}% de bonnes réponses</p>

        <button
          onClick={() => {
            setPhase("setup");
            setQuestions([]);
          }}
          className="w-full py-3 rounded-lg bg-[var(--brand-red)] text-white font-semibold hover:bg-[var(--brand-red-hover)] transition-colors"
        >
          Rejouer
        </button>
      </div>
    </div>
  );
}
