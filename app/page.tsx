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
    <div className="flex-1 w-full flex items-center justify-center px-6">
      <p className="max-w-xl text-center text-base sm:text-lg text-[var(--fg-muted)]">
        Site non-officiel dédié à l&apos;émission{" "}
        <em>Faites entrer l&apos;accusé</em>.
      </p>
    </div>
  );
}
