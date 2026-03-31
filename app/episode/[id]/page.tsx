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

function getSummary(text: string): string {
  // Get first 1-2 paragraphs, around 300-500 chars
  const paragraphs = text.split(/\n+/).filter((p) => {
    const t = p.trim();
    return t.length > 30 && !t.startsWith("==");
  });
  if (paragraphs.length === 0) return "";

  let summary = paragraphs[0].trim();
  if (paragraphs.length > 1 && summary.length < 300) {
    summary += " " + paragraphs[1].trim();
  }

  // Cap at ~500 chars on a sentence boundary
  if (summary.length > 500) {
    const cut = summary.slice(0, 500);
    const lastDot = cut.lastIndexOf(".");
    return lastDot > 150 ? cut.slice(0, lastDot + 1) : cut + "...";
  }

  return summary;
}

function guessWikipediaUrl(title: string): string | null {
  // Try to extract a case name for Wikipedia search
  // "Person — Subtitle" -> search for "Affaire Person"
  const dashMatch = title.match(/^(.+?)\s*[—–-]\s*/);
  if (dashMatch) {
    const name = dashMatch[1].trim();
    return `https://fr.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent("Affaire " + name)}`;
  }
  return `https://fr.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(title)}`;
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

  const shortSummary = episode.wikiSummary
    ? getSummary(episode.wikiSummary)
    : null;

  const wikiUrl = guessWikipediaUrl(episode.title);

  return (
    <div className="flex-1">
      <div className="max-w-3xl mx-auto w-full">
        <PageTitle
          title={episode.title}
          subtitle={[seasonEp, episode.airDate ? `Diffusé le ${formatDate(episode.airDate)}` : null].filter(Boolean).join(" — ")}
        />
      </div>
      <article className="max-w-3xl mx-auto px-4 pb-10">

        <section className="mb-8">
          <h2 className="text-xs uppercase tracking-widest text-[var(--fg-dim)] mb-3">
            L&apos;affaire
          </h2>
          {episode.description && (
            <p className="text-gray-300 leading-relaxed mb-3">
              {episode.description}
            </p>
          )}
          {shortSummary && (
            <p className="text-[var(--fg-muted)] leading-relaxed text-sm mb-3">
              {shortSummary}
            </p>
          )}
          {wikiUrl && (
            <a
              href={wikiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-[var(--accent-link)] hover:underline"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              Lire sur Wikipédia
            </a>
          )}
        </section>

        {episode.keywords.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xs uppercase tracking-widest text-[var(--fg-dim)] mb-3">
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
            <h2 className="text-xs uppercase tracking-widest text-[var(--fg-dim)] mb-3">
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
