import type { Metadata } from "next";
import QuizClient from "./QuizClient";

export const metadata: Metadata = {
  title: "Quiz — wikifela",
  description: "Testez vos connaissances sur les affaires de Faites entrer l'accusé.",
};

export default function QuizPage() {
  return <QuizClient />;
}
