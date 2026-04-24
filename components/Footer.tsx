import Link from "next/link";

export default function Footer() {
  return (
    <footer className="hidden md:block border-t border-[var(--border)] mt-auto">
      <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-[var(--fg-dim)]">
        <p>
          Projet fan non officiel — sans affiliation avec France Televisions, Mag TV ou 17 Juin Media.
          Tous droits relatifs a{" "}
          <em>Faites entrer l&apos;accuse</em> appartiennent a leurs detenteurs respectifs.
        </p>
        <div className="flex items-center gap-3 shrink-0">
          <span>Donnees issues de Wikipedia (CC BY-SA 3.0)</span>
          <Link href="/roadmap" className="hover:text-[var(--fg-muted)] transition-colors">
            Roadmap
          </Link>
        </div>
      </div>
    </footer>
  );
}
