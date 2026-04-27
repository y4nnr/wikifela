import Link from "next/link";
import { Info } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

export default function FloatingActions() {
  return (
    <div className="fixed top-3 right-3 md:top-auto md:bottom-4 md:right-4 z-50 flex items-center gap-2">
      <ThemeToggle />
      <Link
        href="/a-propos"
        title="À propos"
        aria-label="À propos"
        className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-[var(--bg-card)] border border-[var(--border)] shadow-lg flex items-center justify-center text-[var(--fg-muted)] hover:text-[var(--fg)] hover:border-[var(--border-hover)] transition-colors"
      >
        <Info size={16} strokeWidth={2} />
      </Link>
    </div>
  );
}
