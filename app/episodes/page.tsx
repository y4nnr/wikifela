import type { Metadata } from "next";
import EpisodesClient from "./EpisodesClient";

export const metadata: Metadata = {
  title: "Épisodes — wikifela",
  description: "Liste complète des épisodes de Faites entrer l'accusé par saison.",
};

export default function EpisodesPage() {
  return <EpisodesClient />;
}
