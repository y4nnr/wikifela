import { Suspense } from "react";
import RechercheClient from "./RechercheClient";

export const metadata = {
  title: "Recherche — wikifela",
  description: "Recherchez parmi tous les épisodes de Faites entrer l'accusé.",
};

export default function ReChercheePage() {
  return (
    <Suspense fallback={null}>
      <RechercheClient />
    </Suspense>
  );
}
