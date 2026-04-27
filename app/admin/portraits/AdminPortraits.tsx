"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import AdminAuthGate from "@/components/AdminAuthGate";

interface Portrait {
  id: number;
  episodeId: number;
  episodeTitle: string | null;
  season: number | null;
  episode: number | null;
  personName: string;
  subtitle: string | null;
  gender: "M" | "F";
  imagePath: string;
  isPrimary: boolean;
  takedownAt: string | null;
  takedownReason: string | null;
}

type GenderFilter = "all" | "M" | "F";
type TakedownFilter = "active" | "takendown" | "all";

export default function AdminPortraits() {
  const [creds, setCreds] = useState("");

  return (
    <AdminAuthGate onAuthenticated={setCreds}>
      <Inner creds={creds} />
    </AdminAuthGate>
  );
}

function Inner({ creds }: { creds: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [portraits, setPortraits] = useState<Portrait[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState<GenderFilter>("all");
  const [takedownFilter, setTakedownFilter] = useState<TakedownFilter>("active");
  const [savedBanner, setSavedBanner] = useState(false);

  const fetchData = useCallback(async () => {
    if (!creds) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/portraits", {
        headers: { Authorization: `Basic ${creds}` },
      });
      const json = await res.json();
      setPortraits(json.portraits || []);
    } finally {
      setLoading(false);
    }
  }, [creds]);

  useEffect(() => {
    if (creds) fetchData();
  }, [creds, fetchData]);

  useEffect(() => {
    if (searchParams.get("saved") === "1") {
      setSavedBanner(true);
      const t = setTimeout(() => {
        setSavedBanner(false);
        router.replace("/admin/portraits");
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [searchParams, router]);

  const handleTakedown = async (id: number, name: string) => {
    if (
      !confirm(
        `Retirer le portrait de "${name}" (RGPD) ?\n\nLes donnees personnelles seront effacees mais la ligne sera conservee pour audit.`
      )
    ) {
      return;
    }
    const reason = prompt("Raison interne (optionnel):") || "";
    const res = await fetch(`/api/admin/portraits/${id}/takedown`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${creds}`,
      },
      body: JSON.stringify({ reason }),
    });
    const json = await res.json();
    if (json.ok) {
      fetchData();
    } else {
      alert(json.error || "Erreur");
    }
  };

  const handleHardDelete = async (id: number, name: string) => {
    if (
      !confirm(
        `SUPPRESSION DEFINITIVE\n\nSupprimer la ligne du portrait "${name}" ?\n\nReserve aux entrees de test ou erreurs. Pour les retraits RGPD, utiliser "Retirer (RGPD)".`
      )
    ) {
      return;
    }
    if (!confirm("Vraiment ? Cette action est irreversible.")) return;
    const res = await fetch(`/api/admin/portraits/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Basic ${creds}` },
    });
    const json = await res.json();
    if (json.ok) {
      setPortraits((prev) => prev.filter((p) => p.id !== id));
    } else {
      alert(json.error || "Erreur");
    }
  };

  // Filters
  let filtered = portraits;

  if (takedownFilter === "active") {
    filtered = filtered.filter((p) => p.takedownAt == null);
  } else if (takedownFilter === "takendown") {
    filtered = filtered.filter((p) => p.takedownAt != null);
  }

  if (genderFilter !== "all") {
    filtered = filtered.filter((p) => p.gender === genderFilter);
  }

  if (search.trim()) {
    const s = search.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.personName.toLowerCase().includes(s) ||
        (p.episodeTitle && p.episodeTitle.toLowerCase().includes(s)) ||
        (p.subtitle && p.subtitle.toLowerCase().includes(s))
    );
  }

  const stats = {
    total: portraits.length,
    active: portraits.filter((p) => p.takedownAt == null).length,
    takendown: portraits.filter((p) => p.takedownAt != null).length,
    male: portraits.filter((p) => p.gender === "M" && p.takedownAt == null).length,
    female: portraits.filter((p) => p.gender === "F" && p.takedownAt == null).length,
  };

  return (
    <div className="flex-1 px-4 py-6 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href="/admin"
            className="text-xs text-[var(--fg-dim)] hover:text-[var(--fg)] transition-colors"
          >
            &larr; Tableau de bord
          </Link>
          <h1 className="text-xl font-bold text-[var(--fg)] mt-2">Portraits</h1>
          <p className="text-xs text-[var(--fg-dim)] mt-0.5">
            {stats.active} actifs, {stats.takendown} retires (total: {stats.total})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/portraits/new"
            className="px-3 py-1.5 rounded bg-[var(--brand-red)] text-white text-xs font-semibold hover:bg-[var(--brand-red-hover)] transition-colors"
          >
            + Nouveau portrait
          </Link>
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-3 py-1.5 rounded border border-[var(--border)] text-xs text-[var(--fg-muted)] hover:border-[var(--border-hover)] transition-colors disabled:opacity-50"
          >
            {loading ? "..." : "Rafraichir"}
          </button>
        </div>
      </div>

      {savedBanner && (
        <div className="border border-[var(--success)] rounded-lg bg-[var(--success)]/10 p-2 text-xs text-[var(--success)] mb-4">
          Portrait enregistre avec succes.
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="border border-[var(--border)] rounded-lg bg-[var(--bg-card)] p-3 text-center">
          <div className="text-lg font-bold text-[var(--fg)]">{stats.male}</div>
          <div className="text-[10px] text-[var(--fg-dim)] uppercase">Hommes</div>
        </div>
        <div className="border border-[var(--border)] rounded-lg bg-[var(--bg-card)] p-3 text-center">
          <div className="text-lg font-bold text-[var(--fg)]">{stats.female}</div>
          <div className="text-[10px] text-[var(--fg-dim)] uppercase">Femmes</div>
        </div>
        <div className="border border-[var(--border)] rounded-lg bg-[var(--bg-card)] p-3 text-center">
          <div className="text-lg font-bold" style={{ color: "var(--success)" }}>
            {stats.active}
          </div>
          <div className="text-[10px] text-[var(--fg-dim)] uppercase">Actifs</div>
        </div>
        <div className="border border-[var(--border)] rounded-lg bg-[var(--bg-card)] p-3 text-center">
          <div className="text-lg font-bold" style={{ color: "var(--brand-orange)" }}>
            {stats.takendown}
          </div>
          <div className="text-[10px] text-[var(--fg-dim)] uppercase">Retires</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          type="text"
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-1.5 rounded border border-[var(--border)] bg-[var(--bg-input)] text-[var(--fg)] text-xs w-48 focus:outline-none focus:border-[var(--border-hover)]"
        />
        {(["all", "M", "F"] as GenderFilter[]).map((g) => (
          <button
            key={g}
            onClick={() => setGenderFilter(g)}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${
              genderFilter === g
                ? "bg-[var(--brand-red)] text-white"
                : "border border-[var(--border)] text-[var(--fg-dim)] hover:border-[var(--border-hover)]"
            }`}
          >
            {g === "all" ? "Tous" : g === "M" ? "Hommes" : "Femmes"}
          </button>
        ))}
        <span className="text-[var(--border)]">|</span>
        {(["active", "takendown", "all"] as TakedownFilter[]).map((t) => (
          <button
            key={t}
            onClick={() => setTakedownFilter(t)}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${
              takedownFilter === t
                ? "bg-[var(--brand-red)] text-white"
                : "border border-[var(--border)] text-[var(--fg-dim)] hover:border-[var(--border-hover)]"
            }`}
          >
            {t === "active" ? "Actifs" : t === "takendown" ? "Retires" : "Tous"}
          </button>
        ))}
      </div>

      <div className="text-xs text-[var(--fg-dim)] mb-2">{filtered.length} resultats</div>

      {/* Table */}
      <div className="border border-[var(--border)] rounded-lg overflow-hidden text-xs">
        <div className="grid grid-cols-[60px_1fr_180px_50px_50px_90px_180px] items-center px-3 py-2 bg-[var(--bg-card)] border-b border-[var(--border)] text-[var(--fg-dim)]">
          <span></span>
          <span>Nom</span>
          <span>Episode</span>
          <span className="text-center">Genre</span>
          <span className="text-center">Princ.</span>
          <span>Statut</span>
          <span className="text-right">Actions</span>
        </div>

        {filtered.map((p) => {
          const isDown = p.takedownAt != null;
          return (
            <div
              key={p.id}
              className={`grid grid-cols-[60px_1fr_180px_50px_50px_90px_180px] items-center px-3 py-2 border-b border-[var(--border)] last:border-0 ${
                isDown ? "opacity-50 bg-[var(--bg-card)]" : ""
              }`}
            >
              <div className="w-12 h-14 rounded overflow-hidden bg-[var(--bg-input)] border border-[var(--border)]">
                {p.imagePath && !isDown ? (
                  <Image
                    src={`/portraits/${p.imagePath}`}
                    alt={p.personName}
                    width={48}
                    height={56}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[var(--fg-dim)]">
                    —
                  </div>
                )}
              </div>
              <div>
                <div className="text-[var(--fg)] truncate">{p.personName || "(retire)"}</div>
                {p.subtitle && (
                  <div className="text-[10px] text-[var(--fg-dim)] truncate">{p.subtitle}</div>
                )}
              </div>
              <Link
                href={`/admin/episode/${p.episodeId}`}
                className="text-[var(--fg-dim)] hover:text-[var(--fg)] transition-colors truncate"
              >
                <span className="font-mono">
                  S{p.season}E{p.episode}
                </span>{" "}
                <span className="text-[var(--fg-muted)]">— {p.episodeTitle}</span>
              </Link>
              <span className="text-center text-[var(--fg-muted)]">{p.gender}</span>
              <span className="text-center">{p.isPrimary ? "✓" : ""}</span>
              <span>
                {isDown ? (
                  <span className="text-[10px] text-[var(--brand-orange)] border border-[var(--brand-orange)] rounded px-1.5 py-0.5">
                    Retire
                  </span>
                ) : (
                  <span className="text-[10px] text-[var(--success)]">Actif</span>
                )}
              </span>
              <div className="flex items-center justify-end gap-2 text-[10px]">
                {!isDown && (
                  <>
                    <Link
                      href={`/admin/portraits/${p.id}/edit`}
                      className="text-[var(--accent-link)] hover:underline"
                    >
                      Modifier
                    </Link>
                    <button
                      onClick={() => handleTakedown(p.id, p.personName)}
                      className="text-[var(--brand-orange)] hover:underline"
                      title="Retirer pour conformite RGPD (donnees scrubbees)"
                    >
                      Retirer
                    </button>
                  </>
                )}
                <button
                  onClick={() => handleHardDelete(p.id, p.personName || `#${p.id}`)}
                  className="text-[var(--brand-red)] hover:underline"
                  title="Suppression definitive (test/erreurs)"
                >
                  Supprimer
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
