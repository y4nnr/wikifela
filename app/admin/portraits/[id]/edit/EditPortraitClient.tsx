"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminAuthGate from "@/components/AdminAuthGate";
import PortraitForm from "@/components/PortraitForm";

interface PortraitData {
  episodeId: number;
  personName: string;
  subtitle: string;
  gender: "M" | "F";
  isPrimary: boolean;
  imagePath: string;
}

export default function EditPortraitClient({ id }: { id: string }) {
  const [creds, setCreds] = useState("");
  const [data, setData] = useState<PortraitData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!creds) return;
    fetch(`/api/admin/portraits/${id}`, {
      headers: { Authorization: `Basic ${creds}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) {
          setError(d.error || "Erreur");
        } else {
          setData({
            episodeId: d.data.episodeId,
            personName: d.data.personName,
            subtitle: d.data.subtitle || "",
            gender: d.data.gender,
            isPrimary: d.data.isPrimary,
            imagePath: d.data.imagePath,
          });
        }
      });
  }, [creds, id]);

  return (
    <AdminAuthGate onAuthenticated={setCreds}>
      <div className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full">
        <div className="mb-6">
          <Link
            href="/admin/portraits"
            className="text-xs text-[var(--fg-dim)] hover:text-[var(--fg)] transition-colors"
          >
            &larr; Liste des portraits
          </Link>
          <h1 className="text-xl font-bold text-[var(--fg)] mt-2">Modifier le portrait</h1>
        </div>
        {error ? (
          <p className="text-sm text-[var(--brand-red)]">{error}</p>
        ) : !data ? (
          <p className="text-xs text-[var(--fg-dim)]">Chargement...</p>
        ) : (
          <PortraitForm
            creds={creds}
            mode="edit"
            portraitId={parseInt(id, 10)}
            initial={data}
          />
        )}
      </div>
    </AdminAuthGate>
  );
}
