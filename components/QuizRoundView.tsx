"use client";

import { useState } from "react";

export interface QuizQuestion {
  id?: number;
  question: string;
  episodeId: number | null;
  options: string[];
  correctIndex: number;
}

interface QuizRoundViewProps {
  question: QuizQuestion;
  onAnswered: (info: { correct: boolean; episodeId: number | null }) => void;
  renderAfter?: (info: { correct: boolean; episodeId: number | null }) => React.ReactNode;
}

export default function QuizRoundView({ question, onAnswered, renderAfter }: QuizRoundViewProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  const handleAnswer = (idx: number) => {
    if (revealed) return;
    setSelected(idx);
    setRevealed(true);
    onAnswered({
      correct: idx === question.correctIndex,
      episodeId: question.episodeId,
    });
  };

  return (
    <div className="w-full max-w-lg">
      <h3 className="text-lg font-medium mb-6 leading-relaxed">{question.question}</h3>

      <div className="space-y-3">
        {question.options.map((option, i) => {
          let cls = "w-full text-left px-4 py-3 rounded-lg border transition-all text-sm ";
          if (!revealed) {
            cls +=
              selected === i
                ? "border-[var(--accent)] text-[var(--accent)] bg-white/5"
                : "border-[var(--border)] text-[var(--fg-muted)] hover:border-[var(--border-hover)]";
          } else if (i === question.correctIndex) {
            cls += "border-[var(--success)] text-[var(--success)] bg-[var(--success)]/10";
          } else if (i === selected) {
            cls += "border-[var(--brand-red)] text-[var(--brand-red)] bg-red-500/10";
          } else {
            cls += "border-[var(--border)] text-[var(--fg-dim)]";
          }

          return (
            <button key={i} onClick={() => handleAnswer(i)} className={cls} disabled={revealed}>
              {option}
            </button>
          );
        })}
      </div>

      {revealed && renderAfter?.({
        correct: selected === question.correctIndex,
        episodeId: question.episodeId,
      })}
    </div>
  );
}
