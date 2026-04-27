import { Suspense } from "react";
import AdminPortraits from "./AdminPortraits";

export const metadata = {
  title: "Portraits — Admin wikifela",
  robots: "noindex, nofollow",
};

export default function AdminPortraitsPage() {
  return (
    <Suspense fallback={null}>
      <AdminPortraits />
    </Suspense>
  );
}
