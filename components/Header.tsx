"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { HelpCircle, Glasses, MapPin, Gamepad2, ChevronRight } from "lucide-react";

const SearchIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const ListIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);

const MapIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

interface NavLink {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const pageLinks: NavLink[] = [
  { href: "/recherche", label: "Recherche", icon: SearchIcon },
  { href: "/episodes", label: "Épisodes", icon: ListIcon },
  { href: "/carte", label: "Carte", icon: MapIcon },
];

const gameItems: NavLink[] = [
  { href: "/quiz", label: "Quiz", icon: <HelpCircle size={20} strokeWidth={2} /> },
  { href: "/tapissage", label: "Tapissage", icon: <Glasses size={20} strokeWidth={2} /> },
  { href: "/geofela", label: "GeoFELA", icon: <MapPin size={20} strokeWidth={2} /> },
];

export default function Header() {
  const pathname = usePathname();
  const [desktopOpen, setDesktopOpen] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close desktop dropdown on outside click
  useEffect(() => {
    if (!desktopOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !dropdownRef.current?.contains(target)
      ) {
        setDesktopOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [desktopOpen]);

  // Escape closes either menu and refocuses trigger when desktop
  useEffect(() => {
    if (!desktopOpen && !mobileSheetOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (desktopOpen) {
        setDesktopOpen(false);
        triggerRef.current?.focus();
      }
      if (mobileSheetOpen) setMobileSheetOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [desktopOpen, mobileSheetOpen]);

  // Lock body scroll when bottom sheet is open
  useEffect(() => {
    if (!mobileSheetOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileSheetOpen]);

  // Close menus on route change
  useEffect(() => {
    setDesktopOpen(false);
    setMobileSheetOpen(false);
  }, [pathname]);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 border-b-2 border-white bg-black z-50 md:static md:top-auto md:left-auto md:right-auto md:border-b md:border-[var(--border)] md:bg-[var(--bg)] md:relative">
        <div className="h-14 md:h-auto flex items-center justify-start md:justify-center gap-6 lg:gap-8 px-4 md:py-3">
          <Link
            href="/"
            className="text-2xl font-black font-[family-name:var(--font-fela)] uppercase shrink-0 bg-black inline-flex items-center px-2.5 py-1 rounded-md tracking-wide"
          >
            <span className="text-[#fcf84f]">WIKI</span>
            <span className="text-[#fe0000]">FELA</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {pageLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:border-[var(--border-hover)] transition-colors"
              >
                <span className="[&_svg]:w-3.5 [&_svg]:h-3.5">{link.icon}</span>
                {link.label}
              </Link>
            ))}

            {/* Jeux dropdown trigger */}
            <div className="relative">
              <button
                ref={triggerRef}
                type="button"
                onClick={() => setDesktopOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={desktopOpen}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:border-[var(--border-hover)] transition-colors"
              >
                <Gamepad2 className="w-3.5 h-3.5" strokeWidth={2} />
                Jeux
              </button>
              {desktopOpen && (
                <div
                  ref={dropdownRef}
                  role="menu"
                  className="absolute left-0 top-[calc(100%+6px)] w-48 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] shadow-lg overflow-hidden z-50"
                >
                  {gameItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      role="menuitem"
                      onClick={() => setDesktopOpen(false)}
                      className="flex items-center gap-3 px-3.5 py-3 text-sm text-[var(--fg)] hover:bg-[var(--bg-input)] transition-colors"
                    >
                      <span className="text-[var(--fg-muted)] [&_svg]:w-[18px] [&_svg]:h-[18px]">
                        {item.icon}
                      </span>
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--tab-bg)] shadow-[var(--shadow-tab-top)] border-t-2 border-white safe-bottom">
        <div className="flex justify-around items-center py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
          {pageLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href === "/episodes" && pathname.startsWith("/episode/"));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-opacity min-w-[3rem] ${
                  isActive ? "opacity-100" : "opacity-60"
                }`}
                style={{ color: "var(--tab-fg)" }}
              >
                {link.icon}
                <span className="text-[9px]">{link.label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMobileSheetOpen((v) => !v)}
            aria-haspopup="dialog"
            aria-expanded={mobileSheetOpen}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-opacity min-w-[3rem] ${
              mobileSheetOpen ? "opacity-100" : "opacity-60"
            }`}
            style={{ color: "var(--tab-fg)" }}
          >
            <Gamepad2 size={20} strokeWidth={2} />
            <span className="text-[9px]">Jeux</span>
          </button>
        </div>
      </nav>

      {/* Mobile bottom sheet for Jeux */}
      <div
        aria-hidden={!mobileSheetOpen}
        className={`md:hidden fixed inset-0 z-[60] bg-black transition-opacity duration-300 ${
          mobileSheetOpen
            ? "opacity-50 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileSheetOpen(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Choisir un jeu"
        aria-hidden={!mobileSheetOpen}
        className={`md:hidden fixed left-0 right-0 bottom-0 z-[70] bg-[var(--bg-card)] rounded-t-2xl shadow-2xl border-t border-[var(--border)] transition-transform duration-300 ease-out ${
          mobileSheetOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex justify-center pt-2.5 pb-1">
          <span className="block w-9 h-1 rounded-full bg-[var(--fg-muted)] opacity-50" />
        </div>
        <div className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="text-[10px] uppercase tracking-wider text-[var(--fg-dim)] py-2">
            Jeux
          </div>
          <ul className="divide-y divide-[var(--border)]">
            {gameItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMobileSheetOpen(false)}
                  className="flex items-center gap-4 py-4 text-[var(--fg)] active:bg-[var(--bg-input)] transition-colors"
                >
                  <span className="text-[var(--fg-muted)] [&_svg]:w-[22px] [&_svg]:h-[22px]">
                    {item.icon}
                  </span>
                  <span className="flex-1 text-base font-medium">{item.label}</span>
                  <ChevronRight
                    size={18}
                    strokeWidth={2}
                    className="shrink-0 text-[var(--fg-dim)]"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
