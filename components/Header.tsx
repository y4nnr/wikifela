"use client";

import Link from "next/link";

const links = [
  { href: "/", label: "Recherche", icon: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  )},
  { href: "/episodes", label: "Épisodes", icon: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"/>
      <line x1="8" y1="12" x2="21" y2="12"/>
      <line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/>
      <line x1="3" y1="12" x2="3.01" y2="12"/>
      <line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  )},
  { href: "/carte", label: "Carte", icon: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  )},
  { href: "/quiz", label: "Quiz", icon: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  )},
  { href: "/tapissage", label: "Tapissage", icon: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1"/>
      <rect x="14" y="3" width="7" height="9" rx="1"/>
      <line x1="6.5" y1="15" x2="6.5" y2="21"/>
      <line x1="17.5" y1="15" x2="17.5" y2="21"/>
    </svg>
  )},
  { href: "/roadmap", label: "Roadmap", desktopOnly: true, icon: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
      <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
    </svg>
  )},
];

export default function Header() {

  return (
    <>
      {/* Top header — logo + desktop nav */}
      <header className="border-b border-[var(--border)] bg-[var(--bg)] relative z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <Link
            href="/"
            className="text-2xl font-black font-[family-name:var(--font-fela)] uppercase shrink-0 bg-black inline-flex items-center px-2.5 py-1 rounded-md tracking-wide"
          >
            <span className="text-[#fcf84f]">WIKI</span>
            <span className="text-[#fe0000]">FELA</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:border-[var(--border-hover)] transition-colors"
              >
                <span className="[&_svg]:w-3.5 [&_svg]:h-3.5">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--bg)] border-t border-[var(--border)] safe-bottom">
        <div className="flex justify-around items-center py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
          {links.filter((l) => !(l as any).desktopOnly).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors min-w-[3rem] text-[var(--fg-dim)] hover:text-[var(--fg-muted)]"
              >
                {link.icon}
                <span className="text-[9px]">{link.label}</span>
              </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
