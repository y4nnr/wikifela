"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import PageTitle from "@/components/PageTitle";

interface Question {
  question: string;
  episodeId: number;
  options: string[];
  correctIndex: number;
}

type Difficulty = "facile" | "moyen" | "difficile";
type Phase = "setup" | "playing" | "result";

export default function QuizClient() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [difficulty, setDifficulty] = useState<Difficulty>("facile");
  const [count, setCount] = useState(5);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);

  const startQuiz = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/quiz?difficulty=${difficulty}&count=${count}`
      );
      const data = await res.json();
      if (data.questions?.length > 0) {
        setQuestions(data.questions);
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
  }, [difficulty, count]);

  const handleAnswer = (optionIndex: number) => {
    if (revealed) return;
    setSelected(optionIndex);
    setRevealed(true);
    if (optionIndex === questions[currentIndex].correctIndex) {
      setScore((s) => s + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIndex + 1 >= questions.length) {
      setPhase("result");
    } else {
      setCurrentIndex((i) => i + 1);
      setSelected(null);
      setRevealed(false);
    }
  };

  const difficultyColors: Record<Difficulty, string> = {
    facile: "border-green-600 text-green-400",
    moyen: "border-[#fe6c03] text-[#fe6c03]",
    difficile: "border-[#fe0000] text-[#fe0000]",
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
            <label className="block text-sm text-[var(--fg-muted)] mb-3">
              Difficulté
            </label>
            <div className="flex gap-3">
              {(["facile", "moyen", "difficile"] as Difficulty[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`flex-1 py-2.5 rounded-lg border text-sm font-medium capitalize transition-all ${
                    difficulty === d
                      ? `${difficultyColors[d]} bg-white/5`
                      : "border-[var(--border)] text-[var(--fg-dim)] hover:border-gray-600"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-[var(--fg-muted)] mb-3">
              Nombre de questions
            </label>
            <div className="flex gap-3">
              {[3, 5, 10].map((n) => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    count === n
                      ? "border-[var(--accent)] text-[var(--accent)] bg-white/5"
                      : "border-[var(--border)] text-[var(--fg-dim)] hover:border-gray-600"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={startQuiz}
            disabled={loading}
            className="w-full py-3 rounded-lg bg-[#fe0000] text-white font-semibold hover:bg-[#e00000] transition-colors disabled:opacity-50 mt-4"
          >
            {loading ? "Chargement..." : "Commencer"}
          </button>
        </div>
      </div>
    );
  }

  // PLAYING
  if (phase === "playing") {
    const q = questions[currentIndex];
    return (
      <div className="flex-1 flex flex-col items-center px-4 pt-8">
        {/* Progress */}
        <div className="w-full max-w-lg mb-6">
          <div className="flex justify-between text-xs text-[var(--fg-dim)] mb-2">
            <span>
              Question {currentIndex + 1} / {questions.length}
            </span>
            <span>
              {score} bonne{score !== 1 ? "s" : ""} réponse
              {score !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="w-full h-1 bg-gray-800 rounded-full">
            <div
              className="h-1 bg-[#fe0000] rounded-full transition-all"
              style={{
                width: `${((currentIndex + 1) / questions.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="w-full max-w-lg">
          <h3 className="text-lg font-medium mb-6 leading-relaxed">
            {q.question}
          </h3>

          <div className="space-y-3">
            {q.options.map((option, i) => {
              let cls =
                "w-full text-left px-4 py-3 rounded-lg border transition-all text-sm ";
              if (!revealed) {
                cls +=
                  selected === i
                    ? "border-[var(--accent)] text-[var(--accent)] bg-white/5"
                    : "border-[var(--border)] text-gray-300 hover:border-gray-500";
              } else if (i === q.correctIndex) {
                cls += "border-green-500 text-green-400 bg-green-500/10";
              } else if (i === selected) {
                cls += "border-[#fe0000] text-[#fe0000] bg-red-500/10";
              } else {
                cls += "border-[var(--border)] text-[var(--fg-dim)]";
              }

              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  className={cls}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {revealed && (
            <div className="mt-6 flex justify-between items-center">
              <Link
                href={`/episode/${q.episodeId}`}
                className="text-xs text-[var(--fg-dim)] hover:text-[#fe0000] transition-colors"
              >
                Voir l&apos;épisode
              </Link>
              <button
                onClick={nextQuestion}
                className="px-6 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border)] text-sm hover:border-gray-500 transition-colors"
              >
                {currentIndex + 1 >= questions.length
                  ? "Voir le résultat"
                  : "Question suivante"}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // RESULT
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
          <span className={percentage >= 50 ? "text-green-400" : "text-[#fe0000]"}>
            {score}
          </span>
          <span className="text-[var(--fg-dim)]">/{questions.length}</span>
        </div>
        <p className="text-xl text-gray-300 mb-2">{emoji}</p>
        <p className="text-sm text-[var(--fg-dim)] mb-8">{percentage}% de bonnes réponses</p>

        <button
          onClick={() => {
            setPhase("setup");
            setQuestions([]);
          }}
          className="w-full py-3 rounded-lg bg-[#fe0000] text-white font-semibold hover:bg-[#e00000] transition-colors"
        >
          Rejouer
        </button>
      </div>
    </div>
  );
}
