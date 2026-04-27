import { redirect } from "next/navigation";

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
      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-10 sm:py-16">
        <div className="mt-12">
          <hr className="border-t border-[var(--border)]" />
          <p className="my-8 text-base sm:text-lg text-[var(--fg-muted)] text-center">
            Site non-officiel dédié à l&apos;émission{" "}
            <em>Faites entrer l&apos;accusé</em>.
          </p>
          <hr className="border-t border-[var(--border)]" />
        </div>

        <ul className="list-disc pl-6 mt-12 space-y-3 text-[var(--fg)] leading-relaxed">
          <li>
            <strong>Recherche</strong> — un mot, un nom, un lieu, et l&apos;épisode apparaît.
          </li>
          <li>
            <strong>Épisodes</strong> — le catalogue complet, saison par saison.
          </li>
          <li>
            <strong>Carte</strong> — les lieux des affaires, partout en France.
          </li>
          <li>
            <strong>Quiz</strong> — des questions pour tester sa mémoire des épisodes.
          </li>
          <li>
            <strong>Tapissage</strong> — reconnaître l&apos;accusé parmi quatre portraits.
          </li>
        </ul>
      </div>
    </div>
  );
}
