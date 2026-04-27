"use client";

import { useState } from "react";
import Link from "next/link";
import AdminAuthGate from "@/components/AdminAuthGate";
import PortraitForm from "@/components/PortraitForm";

export default function NewPortraitClient() {
  const [creds, setCreds] = useState("");

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
          <h1 className="text-xl font-bold text-[var(--fg)] mt-2">Nouveau portrait</h1>
        </div>
        {creds && (
          <PortraitForm
            creds={creds}
            mode="create"
            initial={{
              episodeId: null,
              personName: "",
              subtitle: "",
              gender: "M",
              isPrimary: false,
              imagePath: "",
            }}
          />
        )}
      </div>
    </AdminAuthGate>
  );
}
