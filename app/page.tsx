import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface HomeProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function HomePage({ searchParams }: HomeProps) {
  const sp = await searchParams;
  if (sp.q) {
    redirect(`/recherche?q=${encodeURIComponent(sp.q)}`);
  }

  return (
    <div className="flex-1 w-full">
      <div className="max-w-2xl mx-auto px-4 sm:px-8 pt-8 sm:pt-12 pb-10 sm:pb-16 space-y-4 sm:space-y-6">
        {/* Intro card */}
        <div className="border border-[var(--border)] rounded-lg bg-[var(--bg-card)] p-6 sm:p-8">
          <p className="text-base sm:text-lg text-[var(--fg-muted)] text-center">
            Site non-officiel dédié à l&apos;émission{" "}
            <em>Faites entrer l&apos;accusé</em>.
          </p>
        </div>

        {/* Features card */}
        <div className="border border-[var(--border)] rounded-lg bg-[var(--bg-card)] p-6 sm:p-8">
          <ul className="divide-y divide-[var(--border)]">
            {[
              { name: "Recherche", desc: "Un mot, un nom, un lieu, et l'épisode apparaît.", href: "/recherche" },
              { name: "Épisodes", desc: "Le catalogue complet, saison par saison.", href: "/episodes" },
              { name: "Carte", desc: "Les lieux des affaires, partout en France.", href: "/carte" },
              { name: "Quiz", desc: "Des questions pour tester sa mémoire des épisodes.", href: "/quiz" },
              { name: "Tapissage", desc: "Reconnaître l'accusé parmi quatre portraits.", href: "/tapissage" },
            ].map((f) => (
              <li key={f.name} className="first:-mt-2 last:-mb-2">
                <Link
                  href={f.href}
                  className="group flex items-center justify-between gap-4 py-3 px-2 -mx-2 rounded transition-colors duration-150 hover:bg-[var(--bg-input)] active:bg-[var(--bg-input)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-link)]"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-[var(--fg)]">{f.name}</p>
                    <p className="text-[var(--fg-muted)] leading-relaxed mt-0.5">{f.desc}</p>
                  </div>
                  <ChevronRight
                    size={18}
                    strokeWidth={2}
                    className="shrink-0 text-[var(--chevron-fg)] opacity-70 group-hover:opacity-100 transition-opacity duration-150"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
