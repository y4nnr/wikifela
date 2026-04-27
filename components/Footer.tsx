export default function Footer() {
  return (
    <footer className="hidden md:block border-t border-[var(--border)] mt-auto">
      <div className="max-w-5xl mx-auto py-4 flex items-center text-[10px] text-[var(--fg-dim)]">
        <div className="flex-1 pl-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <p>
              Projet fan non officiel — sans affiliation avec France Televisions, Mag TV ou 17 Juin Media.
            </p>
            <p>
              Tous droits relatifs a{" "}
              <em>Faites entrer l&apos;accuse</em> appartiennent a leurs detenteurs respectifs.
            </p>
          </div>
          <p className="shrink-0">Donnees issues de Wikipedia (CC BY-SA 3.0)</p>
        </div>
        {/* Reserved right gutter — keeps floating Theme + Info buttons clear of text */}
        <div className="w-28 shrink-0" aria-hidden="true" />
      </div>
    </footer>
  );
}
