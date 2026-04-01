"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface Portrait {
  id: number;
  file: string;
  title: string;
}

export default function ReviewPortraits() {
  const [portraits, setPortraits] = useState<Portrait[]>([]);

  useEffect(() => {
    fetch("/api/review-portraits")
      .then((r) => r.json())
      .then((d) => setPortraits(d.portraits));
  }, []);

  return (
    <div className="flex-1 px-4 py-6">
      <h1 className="text-2xl font-bold mb-2">Review Portraits ({portraits.length})</h1>
      <p className="text-sm text-[var(--fg-dim)] mb-6">
        Tell me the numbers of the wrong ones to remove.
      </p>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
        {portraits.map((p) => (
          <div key={p.id} className="text-center">
            <div className="relative w-full aspect-[3/4] mb-1 overflow-hidden rounded border border-[var(--border)] bg-[var(--bg-card)]">
              <Image
                src={`/portraits/${p.file}`}
                alt={`ID ${p.id}`}
                fill
                className="object-cover"
                sizes="150px"
              />
            </div>
            <span className="text-xs font-mono text-[var(--brand-red)] font-bold">#{p.id}</span>
            <p className="text-[10px] text-[var(--fg-dim)] truncate">{p.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
