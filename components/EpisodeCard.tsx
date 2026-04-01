import Link from "next/link";
import type { SearchResult } from "@/lib/search";

interface EpisodeCardProps {
  episode: SearchResult;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function EpisodeCard({ episode }: EpisodeCardProps) {
  const seasonEp =
    episode.season != null && episode.episode != null
      ? `Saison ${episode.season}, Épisode ${episode.episode}`
      : null;

  return (
    <article className="mb-7">
      <div className="flex items-center gap-2 text-xs text-[var(--fg-dim)] mb-0.5">
        {seasonEp && <span>{seasonEp}</span>}
        {seasonEp && episode.airDate && <span>·</span>}
        {episode.airDate && <span>{formatDate(episode.airDate)}</span>}
      </div>
      <Link href={`/episode/${episode.id}`}>
        <h2 className="text-lg text-[var(--accent)] hover:underline cursor-pointer leading-snug mb-1">
          {episode.title}
        </h2>
      </Link>
      <p
        className="text-sm text-[var(--fg-muted)] leading-relaxed [&_mark]:bg-transparent [&_mark]:text-[var(--brand-orange)] [&_mark]:font-semibold"
        dangerouslySetInnerHTML={{ __html: episode.headline }}
      />
    </article>
  );
}
