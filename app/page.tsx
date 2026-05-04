import { redirect } from "next/navigation";

interface HomeProps {
  searchParams: Promise<{ q?: string }>;
}

const entries: { name: string; desc: string }[] = [
  { name: "Recherche", desc: "un mot et l'épisode apparaît." },
  { name: "Épisodes", desc: "le catalogue complet." },
  { name: "Carte", desc: "les lieux des affaires." },
  { name: "Commissariat", desc: "l'espace défis et jeux." },
];

export default async function HomePage({ searchParams }: HomeProps) {
  const sp = await searchParams;
  if (sp.q) {
    redirect(`/recherche?q=${encodeURIComponent(sp.q)}`);
  }

  return (
    <div className="flex-1 w-full">
      <div className="max-w-xl mx-auto px-6 pt-8 sm:pt-12 pb-10">
        <p className="text-base sm:text-lg text-[var(--fg-muted)]">
          Site non-officiel dédié à l&apos;émission{" "}
          <em>Faites entrer l&apos;accusé</em>.
        </p>

        <hr className="my-6 border-t border-[var(--border)]" />

        <ul className="space-y-2 text-sm sm:text-base text-[var(--fg-muted)]">
          {entries.map((e) => (
            <li key={e.name} className="leading-relaxed">
              <span className="font-bold text-[var(--fg)]">{e.name}</span>
              {" — "}
              {e.desc}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
