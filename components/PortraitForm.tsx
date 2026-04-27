"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import EpisodePicker from "./EpisodePicker";

interface InitialValues {
  episodeId: number | null;
  personName: string;
  subtitle: string;
  gender: "M" | "F";
  isPrimary: boolean;
  imagePath: string;
}

interface PortraitListItem {
  id: number;
  episodeId: number;
  isPrimary: boolean;
  personName: string;
  imagePath: string;
  takedownAt: string | null;
}

interface Props {
  creds: string;
  mode: "create" | "edit";
  portraitId?: number;
  initial: InitialValues;
}

const FILENAME_REGEX = /^[a-zA-Z0-9_-]+\.jpg$/;

export default function PortraitForm({ creds, mode, portraitId, initial }: Props) {
  const router = useRouter();
  const [episodeId, setEpisodeId] = useState<number | null>(initial.episodeId);
  const [personName, setPersonName] = useState(initial.personName);
  const [subtitle, setSubtitle] = useState(initial.subtitle);
  const [gender, setGender] = useState<"M" | "F">(initial.gender);
  const [isPrimary, setIsPrimary] = useState(initial.isPrimary);
  const [imagePath, setImagePath] = useState(initial.imagePath);
  const [filename, setFilename] = useState(initial.imagePath);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [allPortraits, setAllPortraits] = useState<PortraitListItem[]>([]);
  const [existingPrimary, setExistingPrimary] = useState<{ id: number; name: string } | null>(null);
  const [filenameTouched, setFilenameTouched] = useState(mode === "edit");

  // Fetch all portraits for filename suggestion + isPrimary conflict detection
  useEffect(() => {
    if (!creds) return;
    fetch("/api/admin/portraits", {
      headers: { Authorization: `Basic ${creds}` },
    })
      .then((r) => r.json())
      .then((d) => setAllPortraits(d.portraits || []));
  }, [creds]);

  // Suggest a filename when episode changes (create mode, only if user hasn't customized)
  useEffect(() => {
    if (mode !== "create" || filenameTouched || episodeId == null) return;
    const existing = allPortraits.filter(
      (p) => p.episodeId === episodeId && p.takedownAt == null
    );
    let suggestion: string;
    if (existing.length === 0) {
      suggestion = `${episodeId}.jpg`;
    } else {
      // Find next available _N suffix
      const used = new Set(existing.map((p) => p.imagePath));
      let n = existing.length + 1;
      while (used.has(`${episodeId}_${n}.jpg`)) n++;
      suggestion = `${episodeId}_${n}.jpg`;
    }
    setFilename(suggestion);
  }, [episodeId, allPortraits, mode, filenameTouched]);

  // isPrimary conflict detection
  useEffect(() => {
    if (!isPrimary || episodeId == null) {
      setExistingPrimary(null);
      return;
    }
    const other = allPortraits.find(
      (p) =>
        p.episodeId === episodeId &&
        p.isPrimary &&
        p.takedownAt == null &&
        (mode === "create" || p.id !== portraitId)
    );
    setExistingPrimary(other ? { id: other.id, name: other.personName } : null);
  }, [isPrimary, episodeId, allPortraits, mode, portraitId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFilePreview(f ? URL.createObjectURL(f) : null);
  };

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (filePreview) URL.revokeObjectURL(filePreview);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (episodeId == null) return setError("Episode requis");
    if (!personName.trim()) return setError("Nom requis");
    if (!filename.trim()) return setError("Nom de fichier requis");
    if (!FILENAME_REGEX.test(filename.trim())) {
      return setError("Nom de fichier invalide (lettres/chiffres/_/- + .jpg)");
    }

    // In create mode, a file is required.
    if (mode === "create" && !file) {
      return setError("Fichier image requis");
    }

    // Collision check (create mode only)
    if (mode === "create") {
      const collision = allPortraits.some((p) => p.imagePath === filename.trim());
      if (collision) return setError("Ce fichier existe deja en base");
    }

    if (existingPrimary) {
      if (
        !confirm(
          `Cela retirera le statut principal de "${existingPrimary.name}". Continuer ?`
        )
      ) {
        return;
      }
    }

    setSubmitting(true);
    try {
      // Step 1: upload file if provided
      let finalFilename = filename.trim();
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("filename", finalFilename);
        fd.append("mode", mode);
        const upRes = await fetch("/api/admin/portraits/upload", {
          method: "POST",
          headers: { Authorization: `Basic ${creds}` },
          body: fd,
        });
        const upJson = await upRes.json();
        if (!upJson.ok) {
          setError(upJson.error || "Erreur lors de l'upload");
          setSubmitting(false);
          return;
        }
        finalFilename = upJson.filename;
      }

      // Step 2: create or update DB row
      const url =
        mode === "create"
          ? "/api/admin/portraits"
          : `/api/admin/portraits/${portraitId}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${creds}`,
        },
        body: JSON.stringify({
          episodeId,
          personName: personName.trim(),
          subtitle: subtitle.trim() || null,
          gender,
          isPrimary,
          imagePath: finalFilename,
        }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error || "Erreur");
        setSubmitting(false);
        return;
      }
      router.push("/admin/portraits?saved=1");
    } catch {
      setError("Erreur reseau");
      setSubmitting(false);
    }
  };

  // Suppress imagePath unused warning — kept for symmetry but using filename below
  void imagePath;
  void setImagePath;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs text-[var(--fg-muted)] mb-1.5">Episode</label>
        <EpisodePicker creds={creds} value={episodeId} onChange={setEpisodeId} required />
      </div>

      <div>
        <label className="block text-xs text-[var(--fg-muted)] mb-1.5">Nom</label>
        <input
          type="text"
          value={personName}
          onChange={(e) => setPersonName(e.target.value)}
          className="w-full px-3 py-2 rounded border border-[var(--border)] bg-[var(--bg-input)] text-[var(--fg)] text-sm focus:outline-none focus:border-[var(--border-hover)]"
        />
      </div>

      <div>
        <label className="block text-xs text-[var(--fg-muted)] mb-1.5">Sous-titre (optionnel)</label>
        <input
          type="text"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          className="w-full px-3 py-2 rounded border border-[var(--border)] bg-[var(--bg-input)] text-[var(--fg)] text-sm focus:outline-none focus:border-[var(--border-hover)]"
        />
      </div>

      <div>
        <label className="block text-xs text-[var(--fg-muted)] mb-1.5">Genre</label>
        <div className="flex gap-3">
          {(["M", "F"] as const).map((g) => (
            <label
              key={g}
              className={`flex items-center gap-2 px-3 py-2 rounded border cursor-pointer transition-colors ${
                gender === g
                  ? "border-[var(--brand-red)] text-[var(--brand-red)]"
                  : "border-[var(--border)] text-[var(--fg-dim)]"
              }`}
            >
              <input
                type="radio"
                name="gender"
                value={g}
                checked={gender === g}
                onChange={() => setGender(g)}
                className="sr-only"
              />
              <span className="text-sm">{g === "M" ? "Homme" : "Femme"}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Image upload */}
      <div className="border border-[var(--border)] rounded-lg p-3 space-y-3 bg-[var(--bg-card)]">
        <label className="block text-xs text-[var(--fg-muted)]">
          Image {mode === "edit" && <span className="text-[var(--fg-dim)]">(optionnel — laisser vide pour conserver l&apos;image actuelle)</span>}
        </label>

        <input
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="block text-xs text-[var(--fg-muted)]"
        />

        {(filePreview || (mode === "edit" && initial.imagePath && !file)) && (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={filePreview || `/portraits/${initial.imagePath}`}
              alt="apercu"
              className="w-20 h-24 object-cover rounded border border-[var(--border)]"
            />
            <p className="text-[10px] text-[var(--fg-dim)]">
              {filePreview
                ? "Apercu (avant traitement: redimension a 600px max, JPEG q85, EXIF supprime)"
                : `Image actuelle: ${initial.imagePath}`}
            </p>
          </div>
        )}

        <div>
          <label className="block text-xs text-[var(--fg-muted)] mb-1.5">Nom du fichier</label>
          <input
            type="text"
            value={filename}
            onChange={(e) => {
              setFilename(e.target.value);
              setFilenameTouched(true);
            }}
            placeholder="ex: 120.jpg, 55_jl.jpg"
            className="w-full px-3 py-2 rounded border border-[var(--border)] bg-[var(--bg-input)] text-[var(--fg)] text-sm focus:outline-none focus:border-[var(--border-hover)] font-mono"
          />
          <p className="text-[10px] text-[var(--fg-dim)] mt-1">
            Doit terminer par <code>.jpg</code>. Lettres, chiffres, <code>_</code> et <code>-</code> autorises.
          </p>
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isPrimary}
            onChange={(e) => setIsPrimary(e.target.checked)}
            className="rounded border-[var(--border)]"
          />
          <span className="text-sm text-[var(--fg-muted)]">Portrait principal</span>
        </label>
        {existingPrimary && isPrimary && (
          <p className="text-[10px] text-[var(--brand-orange)] mt-1">
            Attention: &quot;{existingPrimary.name}&quot; est actuellement principal pour cet episode.
            Sauvegarder retirera ce statut.
          </p>
        )}
      </div>

      {error && (
        <div className="border border-[var(--brand-red)] rounded p-2 text-xs text-[var(--brand-red)]">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 rounded bg-[var(--brand-red)] text-white text-sm font-semibold hover:bg-[var(--brand-red-hover)] transition-colors disabled:opacity-50"
        >
          {submitting ? "Enregistrement..." : "Enregistrer"}
        </button>
        <Link
          href="/admin/portraits"
          className="text-xs text-[var(--fg-dim)] hover:text-[var(--fg)] transition-colors"
        >
          Annuler
        </Link>
      </div>
    </form>
  );
}
