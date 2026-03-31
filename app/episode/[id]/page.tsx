import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import PageTitle from "@/components/PageTitle";

function formatDate(date: Date | null): string {
  if (!date) return "";
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function EpisodePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const episodeId = parseInt(id, 10);
  if (isNaN(episodeId)) notFound();

  const episode = await prisma.episode.findUnique({
    where: { id: episodeId },
    include: { locations: true },
  });
  if (!episode) notFound();

  const seasonEp =
    episode.season != null && episode.episode != null
      ? `Saison ${episode.season}, Épisode ${episode.episode}`
      : null;

  return (
    <div className="flex-1">
      <div className="max-w-3xl mx-auto w-full">
        <PageTitle
          title={episode.title}
          subtitle={[seasonEp, episode.airDate ? `Diffusé le ${formatDate(episode.airDate)}` : null].filter(Boolean).join(" — ")}
        />
      </div>
      <article className="max-w-3xl mx-auto px-4 pb-10">

        {episode.description && (
          <section className="mb-8">
            <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-3">
              Résumé
            </h2>
            <p className="text-gray-300 leading-relaxed">
              {episode.description}
            </p>
          </section>
        )}

        {episode.wikiSummary && (
          <section className="mb-8">
            <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-3">
              L&apos;affaire
            </h2>
            <div className="text-gray-300 leading-relaxed whitespace-pre-line">
              {episode.wikiSummary}
            </div>
          </section>
        )}

        {episode.keywords.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-3">
              Mots-clés
            </h2>
            <div className="flex flex-wrap gap-2">
              {episode.keywords.map((kw) => (
                <span
                  key={kw}
                  className="px-3 py-1 text-sm bg-gray-800 rounded-full text-gray-300"
                >
                  {kw}
                </span>
              ))}
            </div>
          </section>
        )}

        {episode.locations.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-3">
              Lieux
            </h2>
            <div className="flex flex-wrap gap-2 mb-3">
              {episode.locations.map((loc) => (
                <span
                  key={`${loc.communeName}-${loc.department}`}
                  className="px-3 py-1 text-sm bg-gray-800 rounded-full text-gray-300"
                >
                  {loc.communeName} ({loc.departmentName})
                </span>
              ))}
            </div>
            <Link
              href={`/carte?affaire=${episode.id}`}
              className="text-sm text-[#fe0000] hover:underline"
            >
              Voir sur la carte
            </Link>
          </section>
        )}

      </article>
    </div>
  );
}
