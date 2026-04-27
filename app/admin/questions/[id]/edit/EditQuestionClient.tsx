"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminAuthGate from "@/components/AdminAuthGate";
import QuestionForm from "@/components/QuestionForm";

interface QuestionData {
  question: string;
  correctAnswer: string;
  wrongAnswers: string[];
  difficulty: "facile" | "moyen" | "difficile";
  episodeId: number | null;
  category: string | null;
}

export default function EditQuestionClient({ id }: { id: string }) {
  const [creds, setCreds] = useState("");
  const [data, setData] = useState<QuestionData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!creds) return;
    fetch(`/api/admin/questions/${id}`, {
      headers: { Authorization: `Basic ${creds}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) {
          setError(d.error || "Erreur");
        } else {
          setData({
            question: d.data.question,
            correctAnswer: d.data.correctAnswer,
            wrongAnswers: d.data.wrongAnswers,
            difficulty: d.data.difficulty,
            episodeId: d.data.episodeId,
            category: d.data.category,
          });
        }
      });
  }, [creds, id]);

  return (
    <AdminAuthGate onAuthenticated={setCreds}>
      <div className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full">
        <div className="mb-6">
          <Link
            href="/admin/questions"
            className="text-xs text-[var(--fg-dim)] hover:text-[var(--fg)] transition-colors"
          >
            &larr; Liste des questions
          </Link>
          <h1 className="text-xl font-bold text-[var(--fg)] mt-2">Modifier la question</h1>
        </div>
        {error ? (
          <p className="text-sm text-[var(--brand-red)]">{error}</p>
        ) : !data ? (
          <p className="text-xs text-[var(--fg-dim)]">Chargement...</p>
        ) : (
          <QuestionForm
            creds={creds}
            mode="edit"
            questionId={parseInt(id, 10)}
            initial={data}
          />
        )}
      </div>
    </AdminAuthGate>
  );
}
