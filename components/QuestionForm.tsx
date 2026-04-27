"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import EpisodePicker from "./EpisodePicker";

interface InitialValues {
  question: string;
  correctAnswer: string;
  wrongAnswers: string[];
  difficulty: "facile" | "moyen" | "difficile";
  episodeId: number | null;
  category: string | null;
}

interface Props {
  creds: string;
  mode: "create" | "edit";
  questionId?: number;
  initial: InitialValues;
}

export default function QuestionForm({ creds, mode, questionId, initial }: Props) {
  const router = useRouter();
  const [question, setQuestion] = useState(initial.question);
  const [correctAnswer, setCorrectAnswer] = useState(initial.correctAnswer);
  const [wrongAnswers, setWrongAnswers] = useState<string[]>(
    initial.wrongAnswers.length === 3 ? initial.wrongAnswers : ["", "", ""]
  );
  const [difficulty, setDifficulty] = useState(initial.difficulty);
  const [episodeId, setEpisodeId] = useState<number | null>(initial.episodeId);
  const [category, setCategory] = useState(initial.category || "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const updateWrong = (idx: number, val: string) => {
    setWrongAnswers((prev) => prev.map((w, i) => (i === idx ? val : w)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Client-side validation
    if (!question.trim()) return setError("La question est requise");
    if (!correctAnswer.trim()) return setError("La bonne reponse est requise");
    if (wrongAnswers.some((w) => !w.trim())) return setError("Toutes les mauvaises reponses sont requises");
    if (new Set(wrongAnswers).size !== 3) return setError("Les mauvaises reponses doivent etre distinctes");
    if (wrongAnswers.includes(correctAnswer)) return setError("La bonne reponse ne peut pas figurer dans les mauvaises");

    setSubmitting(true);
    const url =
      mode === "create"
        ? "/api/admin/questions"
        : `/api/admin/questions/${questionId}`;
    const method = mode === "create" ? "POST" : "PATCH";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${creds}`,
        },
        body: JSON.stringify({
          question: question.trim(),
          correctAnswer: correctAnswer.trim(),
          wrongAnswers: wrongAnswers.map((w) => w.trim()),
          difficulty,
          episodeId,
          category: episodeId == null ? (category.trim() || null) : null,
        }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error || "Erreur");
        setSubmitting(false);
        return;
      }
      router.push("/admin/questions?saved=1");
    } catch {
      setError("Erreur reseau");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs text-[var(--fg-muted)] mb-1.5">Question</label>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 rounded border border-[var(--border)] bg-[var(--bg-input)] text-[var(--fg)] text-sm focus:outline-none focus:border-[var(--border-hover)] resize-y"
        />
      </div>

      <div>
        <label className="block text-xs text-[var(--fg-muted)] mb-1.5">Bonne reponse</label>
        <input
          type="text"
          value={correctAnswer}
          onChange={(e) => setCorrectAnswer(e.target.value)}
          className="w-full px-3 py-2 rounded border border-[var(--border)] bg-[var(--bg-input)] text-[var(--fg)] text-sm focus:outline-none focus:border-[var(--border-hover)]"
        />
      </div>

      {[0, 1, 2].map((i) => (
        <div key={i}>
          <label className="block text-xs text-[var(--fg-muted)] mb-1.5">
            Mauvaise reponse {i + 1}
          </label>
          <input
            type="text"
            value={wrongAnswers[i]}
            onChange={(e) => updateWrong(i, e.target.value)}
            className="w-full px-3 py-2 rounded border border-[var(--border)] bg-[var(--bg-input)] text-[var(--fg)] text-sm focus:outline-none focus:border-[var(--border-hover)]"
          />
        </div>
      ))}

      <div>
        <label className="block text-xs text-[var(--fg-muted)] mb-1.5">Difficulte</label>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}
          className="w-full px-3 py-2 rounded border border-[var(--border)] bg-[var(--bg-input)] text-[var(--fg)] text-sm focus:outline-none"
        >
          <option value="facile">Facile</option>
          <option value="moyen">Moyen</option>
          <option value="difficile">Difficile</option>
        </select>
      </div>

      <div>
        <label className="block text-xs text-[var(--fg-muted)] mb-1.5">Episode</label>
        <EpisodePicker creds={creds} value={episodeId} onChange={setEpisodeId} allowGeneral />
      </div>

      {episodeId == null && (
        <div>
          <label className="block text-xs text-[var(--fg-muted)] mb-1.5">
            Categorie (optionnel, pour questions generales)
          </label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="ex: presentateurs, generique..."
            className="w-full px-3 py-2 rounded border border-[var(--border)] bg-[var(--bg-input)] text-[var(--fg)] text-sm focus:outline-none focus:border-[var(--border-hover)]"
          />
        </div>
      )}

      {error && (
        <div className="border border-[var(--brand-red)] rounded p-2 text-xs text-[var(--brand-red)]">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 rounded bg-[var(--brand-red)] text-white text-sm font-semibold hover:bg-[var(--brand-red-hover)] transition-colors disabled:opacity-50"
        >
          {submitting ? "Enregistrement..." : "Enregistrer"}
        </button>
        <Link
          href="/admin/questions"
          className="text-xs text-[var(--fg-dim)] hover:text-[var(--fg)] transition-colors"
        >
          Annuler
        </Link>
      </div>
    </form>
  );
}
