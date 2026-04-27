import Link from "next/link";

export const metadata = {
  title: "À propos — wikifela",
  description:
    "wikifela.org : projet personnel non officiel dédié à l'émission Faites entrer l'accusé. Mentions légales, sources, politique de retrait.",
};

export default function AProposPage() {
  return (
    <div className="flex-1 w-full">
      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-10 sm:py-16">
        {/* Intro */}
        <p className="text-[var(--fg-muted)] leading-relaxed mb-4">
          wikifela.org est un projet personnel, créé par passion pour
          l&apos;émission <em>Faites entrer l&apos;accusé</em>. Le site rassemble
          en un seul endroit le catalogue des épisodes, les lieux des affaires,
          ainsi que des jeux pour les fans. Il n&apos;a aucun lien avec France
          Télévisions ni avec les producteurs de l&apos;émission.
        </p>
        <p className="text-[var(--fg-muted)] leading-relaxed">
          Toute personne représentée sur ce site peut demander le retrait de son
          portrait à tout moment, sans condition, à l&apos;adresse{" "}
          <a
            href="mailto:contact@wikifela.org"
            className="underline hover:text-[var(--fg)] transition-colors"
          >
            contact@wikifela.org
          </a>
          . Les demandes sont traitées dans un délai de sept jours.
        </p>

        <div className="space-y-8 mt-12">
          <section>
            <h2 className="text-lg sm:text-xl font-bold text-[var(--fg)] mb-3">
              Éditeur du site
            </h2>
            <ul className="list-disc pl-6 space-y-1 text-[var(--fg)] leading-relaxed">
              <li>Site : wikifela.org</li>
              <li>
                {/* PLACEHOLDER: replace with real publication director name before
                    sharing the URL publicly. Required by French LCEN article 6. */}
                Directeur de la publication : Kuma Flynt
              </li>
              <li>
                {/* PLACEHOLDER: configure Cloudflare Email Routing for this address
                    before sharing the URL publicly. */}
                Contact :{" "}
                <a
                  href="mailto:contact@wikifela.org"
                  className="underline hover:text-[var(--fg-muted)] transition-colors"
                >
                  contact@wikifela.org
                </a>
              </li>
              <li>Hébergement : VM personnelle, accessible via Cloudflare Tunnel.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg sm:text-xl font-bold text-[var(--fg)] mb-3">
              Nature du site
            </h2>
            <p className="text-[var(--fg)] leading-relaxed">
              wikifela.org est un site de fans, non-officiel, sans but lucratif et
              sans affiliation avec France Télévisions, Mag TV, 17 Juin Média ou
              toute autre entité ayant produit ou diffusé l&apos;émission{" "}
              <em>Faites entrer l&apos;accusé</em>. Tous les droits relatifs à
              l&apos;émission <em>Faites entrer l&apos;accusé</em> appartiennent à
              leurs détenteurs respectifs.
            </p>
          </section>

          <section>
            <h2 className="text-lg sm:text-xl font-bold text-[var(--fg)] mb-3">
              Sources des données
            </h2>
            <p className="text-[var(--fg)] leading-relaxed">
              Les informations présentées sur ce site (résumés, biographies, lieux,
              chronologies) proviennent en grande partie de Wikipédia et sont
              utilisées sous licence Creative Commons BY-SA 3.0. Le site reproduit
              ces contenus avec attribution conformément aux termes de cette
              licence.
            </p>
          </section>

          <section>
            <h2 className="text-lg sm:text-xl font-bold text-[var(--fg)] mb-3">
              Portraits des personnes
            </h2>
            <p className="text-[var(--fg)] leading-relaxed">
              Les portraits affichés sur ce site représentent des personnes ayant
              été évoquées dans l&apos;émission{" "}
              <em>Faites entrer l&apos;accusé</em>, qui a été diffusée publiquement
              sur les chaînes de France Télévisions. Les images sont issues de
              Wikimedia Commons ou de sources publiquement accessibles. Toute
              demande de retrait est traitée dans un délai maximum de sept (7)
              jours, sans condition ni justification requise, à l&apos;adresse{" "}
              <a
                href="mailto:contact@wikifela.org"
                className="underline hover:text-[var(--fg-muted)] transition-colors"
              >
                contact@wikifela.org
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg sm:text-xl font-bold text-[var(--fg)] mb-3">
              Données personnelles et statistiques
            </h2>
            <p className="text-[var(--fg)] leading-relaxed mb-3">
              Ce site utilise Cloudflare Web Analytics pour mesurer
              l&apos;audience. Cet outil ne dépose pas de cookies, ne collecte pas
              d&apos;identifiants personnels, et ne permet pas de tracer un
              visiteur d&apos;un site à l&apos;autre. Aucune donnée personnelle
              n&apos;est conservée par wikifela.org.
            </p>
            <p className="text-[var(--fg)] leading-relaxed">
              Conformément au RGPD et à la loi Informatique et Libertés, toute
              personne peut exercer ses droits d&apos;accès, de rectification ou
              d&apos;effacement en écrivant à{" "}
              <a
                href="mailto:contact@wikifela.org"
                className="underline hover:text-[var(--fg-muted)] transition-colors"
              >
                contact@wikifela.org
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg sm:text-xl font-bold text-[var(--fg)] mb-3">
              Propriété intellectuelle
            </h2>
            <p className="text-[var(--fg)] leading-relaxed">
              Le code source du site est développé par les responsables du site.
              Les contenus encyclopédiques sont sous licence CC BY-SA 3.0. Les
              portraits, extraits, marques et logos appartiennent à leurs ayants
              droit respectifs et sont utilisés à titre informatif et non
              commercial.
            </p>
          </section>

          <section>
            <h2 className="text-lg sm:text-xl font-bold text-[var(--fg)] mb-3">
              Contact
            </h2>
            <p className="text-[var(--fg)] leading-relaxed">
              Pour toute question, demande de retrait, ou signalement
              d&apos;erreur, écrire à{" "}
              <a
                href="mailto:contact@wikifela.org"
                className="underline hover:text-[var(--fg-muted)] transition-colors"
              >
                contact@wikifela.org
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg sm:text-xl font-bold text-[var(--fg)] mb-3">
              Roadmap
            </h2>
            <p className="text-[var(--fg)] leading-relaxed mb-3">
              Le site est en développement actif. Vous pouvez consulter la
              roadmap publique pour suivre les évolutions à venir et les
              fonctionnalités en cours de développement.
            </p>
            <p className="text-[var(--fg)] leading-relaxed">
              →{" "}
              <Link
                href="/roadmap"
                className="underline hover:text-[var(--fg-muted)] transition-colors"
              >
                Voir la roadmap
              </Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
