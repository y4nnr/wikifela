import type { Metadata } from "next";
import PageTitle from "@/components/PageTitle";

export const metadata: Metadata = {
  title: "Roadmap — wikifela",
  description: "Les prochaines fonctionnalités prévues pour wikifela.",
};

interface RoadmapItem {
  title: string;
  description: string;
  status: "done" | "in-progress" | "planned";
}

const items: RoadmapItem[] = [
  {
    title: "Recherche full-text",
    description:
      "Recherche instantanée parmi tous les épisodes avec correspondance partielle et stemming français.",
    status: "done",
  },
  {
    title: "Fiches épisodes",
    description:
      "Page dédiée pour chaque épisode avec résumé Wikipedia, mots-clés et lieux associés.",
    status: "done",
  },
  {
    title: "Carte des affaires",
    description:
      "Carte interactive avec 700+ lieux, filtres par département, type de crime et sélection multi-affaires avec codes couleur.",
    status: "done",
  },
  {
    title: "Quiz",
    description:
      "150 questions sur 3 niveaux de difficulté pour tester ses connaissances sur les affaires.",
    status: "done",
  },
  {
    title: "Comptes utilisateurs",
    description:
      "Inscription et connexion pour sauvegarder sa progression au quiz et ses affaires favorites.",
    status: "planned",
  },
  {
    title: "Classement du quiz",
    description:
      "Tableau des meilleurs scores avec classement par difficulté et nombre de questions.",
    status: "planned",
  },
  {
    title: "Chronologie interactive",
    description:
      "Frise chronologique des affaires de 2000 à aujourd'hui, filtrable par type de crime.",
    status: "planned",
  },
  {
    title: "Liens entre affaires",
    description:
      "Visualiser les connexions entre affaires partageant des thèmes, des lieux ou des protagonistes communs.",
    status: "planned",
  },
  {
    title: "Enrichissement des fiches",
    description:
      "Ajout de photos d'archives, extraits vidéo et liens vers les épisodes en replay.",
    status: "planned",
  },
  {
    title: "Version mobile",
    description:
      "Version optimisée pour mobile avec notifications pour les nouveaux épisodes.",
    status: "planned",
  },
];

const statusConfig = {
  done: { label: "Terminé", color: "bg-[var(--success)]/20 text-[var(--success)] border-[var(--success)]/30" },
  "in-progress": { label: "En cours", color: "bg-[var(--brand-orange)]/20 text-[var(--brand-orange)] border-[var(--brand-orange)]/30" },
  planned: { label: "Prévu", color: "bg-gray-500/20 text-[var(--fg-muted)] border-gray-500/30" },
};

export default function RoadmapPage() {
  return (
    <div className="flex-1">
      <div className="max-w-3xl mx-auto w-full">
        <PageTitle
          title="Roadmap"
          subtitle="Les fonctionnalités terminées et celles à venir pour wikifela"
        />

        <div className="space-y-3 px-4">
          {items.map((item) => {
            const { label, color } = statusConfig[item.status];
            return (
              <div
                key={item.title}
                className="flex gap-4 p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-card)]"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-sm font-semibold text-[var(--fg)]">
                      {item.title}
                    </h3>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border ${color}`}
                    >
                      {label}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--fg-dim)] leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
