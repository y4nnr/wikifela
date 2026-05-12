"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Info } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

function safeInternalPath(raw: string | null): string {
  if (!raw) return "/";
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return "/";
  }
  if (
    !decoded.startsWith("/") ||
    decoded.startsWith("//") ||
    decoded.includes("\\")
  ) {
    return "/";
  }
  return decoded;
}

export default function FloatingActions() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleClick = () => {
    if (pathname === "/a-propos") {
      router.push(safeInternalPath(searchParams.get("from")));
      return;
    }
    const query = searchParams.toString();
    const current = query ? `${pathname}?${query}` : pathname;
    router.push(`/a-propos?from=${encodeURIComponent(current)}`);
  };

  return (
    <div className="fixed top-3 right-3 md:top-auto md:bottom-4 md:right-4 z-50 flex items-center gap-2">
      <ThemeToggle />
      <button
        type="button"
        onClick={handleClick}
        title="À propos"
        aria-label="À propos"
        className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-[#111111] md:bg-[var(--bg-card)] border border-[#262626] md:border-[var(--border)] shadow-lg flex items-center justify-center text-[#d4d4d4] md:text-[var(--fg-muted)] hover:text-[#f5f5f5] md:hover:text-[var(--fg)] hover:border-[#404040] md:hover:border-[var(--border-hover)] transition-colors"
      >
        <Info size={16} strokeWidth={2} />
      </button>
    </div>
  );
}
