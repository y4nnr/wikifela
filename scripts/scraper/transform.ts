import type { RawEpisode } from "./wikipedia";

export interface EpisodeData {
  title: string;
  season: number;
  episode: number;
  airDate: Date | null;
  description: string | null;
  keywords: string[];
  wikiSummary: string | null;
  wikiLinks: string[];
}

export function transformEpisode(raw: RawEpisode): EpisodeData {
  const parts: string[] = [];
  if (raw.crimeType) parts.push(raw.crimeType);
  if (raw.observations) parts.push(raw.observations);
  const description = parts.length > 0 ? parts.join(". ") : null;

  return {
    title: raw.title,
    season: raw.season,
    episode: raw.episode,
    airDate: raw.airDate ? new Date(raw.airDate) : null,
    description,
    keywords: [],
    wikiSummary: null,
    wikiLinks: raw.wikiLinks,
  };
}

export function transformAll(rawEpisodes: RawEpisode[]): EpisodeData[] {
  return rawEpisodes.map(transformEpisode);
}
