import type { Metadata } from "next";
import { Suspense } from "react";
import MapClient from "./MapClient";

export const metadata: Metadata = {
  title: "Carte des affaires — wikifela",
  description:
    "Carte interactive des lieux des affaires de Faites entrer l'accusé.",
};

export default function CartePage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[var(--fg-muted)] text-sm">Chargement...</p>
        </div>
      }
    >
      <MapClient />
    </Suspense>
  );
}
