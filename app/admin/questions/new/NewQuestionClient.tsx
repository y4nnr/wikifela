"use client";

import { useState } from "react";
import Link from "next/link";
import AdminAuthGate from "@/components/AdminAuthGate";
import QuestionForm from "@/components/QuestionForm";

export default function NewQuestionClient() {
  const [creds, setCreds] = useState("");

  return (
    <AdminAuthGate onAuthenticated={setCreds}>
      <div className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full">
        <div className="mb-6">
          <Link href="/admin/questions" className="text-xs text-[var(--fg-dim)] hover:text-[var(--fg)] transition-colors">
            &larr; Liste des questions
          </Link>
          <h1 className="text-xl font-bold text-[var(--fg)] mt-2">Nouvelle question</h1>
        </div>
        {creds && (
          <QuestionForm
            creds={creds}
            mode="create"
            initial={{
              question: "",
              correctAnswer: "",
              wrongAnswers: ["", "", ""],
              difficulty: "moyen",
              episodeId: null,
              category: null,
            }}
          />
        )}
      </div>
    </AdminAuthGate>
  );
}
