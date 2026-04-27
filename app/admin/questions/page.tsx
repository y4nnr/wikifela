import { Suspense } from "react";
import AdminQuestions from "./AdminQuestions";

export const metadata = {
  title: "Questions — Admin wikifela",
  robots: "noindex, nofollow",
};

export default function AdminQuestionsPage() {
  return (
    <Suspense fallback={null}>
      <AdminQuestions />
    </Suspense>
  );
}
