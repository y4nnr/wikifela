"use client";

import { useCallback, useEffect, useState } from "react";

interface LeaderboardEntry {
  id: number;
  nickname: string;
  score: number;
  createdAt: string;
}

interface LeaderboardProps {
  game: "quiz" | "tapissage";
  difficulty?: string;
  playerScore?: number;
  readOnly?: boolean;
  onSubmitted?: () => void;
}

export default function Leaderboard({ game, difficulty, playerScore = 0, readOnly, onSubmitted }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [qualifies, setQualifies] = useState(false);
  const [nickname, setNickname] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const fetchLeaderboard = useCallback(async () => {
    const params = new URLSearchParams({ game });
    if (difficulty) params.set("difficulty", difficulty);
    try {
      const res = await fetch(`/api/leaderboard?${params}`);
      const data = await res.json();
      setEntries(data.entries || []);
      const top = data.entries || [];
      setQualifies(
        top.length < 5 || playerScore > top[top.length - 1].score
      );
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [game, difficulty, playerScore]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const handleSubmit = async () => {
    const trimmed = nickname.trim();
    if (!trimmed || trimmed.length > 20) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game, difficulty: difficulty || undefined, nickname: trimmed, score: playerScore }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erreur");
        return;
      }
      const data = await res.json();
      setEntries(data.entries || []);
      setSubmitted(true);
      setQualifies(false);
      onSubmitted?.();
    } catch {
      setError("Erreur réseau");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-xs text-[var(--fg-dim)] text-center py-4">
        Chargement du classement...
      </div>
    );
  }

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="border border-[var(--border)] rounded-lg bg-[var(--bg-card)] p-4 sm:p-5">
      <div className="text-[10px] text-[var(--fg-dim)] uppercase tracking-wider mb-3 text-center">
        Top 5 — {game === "quiz" ? `Quiz ${difficulty}` : "Tapissage"}
      </div>

      {/* Nickname input if qualifies */}
      {!readOnly && qualifies && !submitted && playerScore > 0 && (
        <div className="mb-4 p-3 rounded-lg border border-[var(--brand-red)]/30 bg-[var(--brand-red)]/5">
          <p className="text-sm text-[var(--fg)] mb-2 text-center font-medium">
            Vous entrez dans le top 5 !
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Votre pseudo"
              maxLength={20}
              className="flex-1 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-sm text-[var(--fg)] placeholder:text-[var(--fg-dim)] focus:outline-none focus:border-[var(--brand-red)]"
              autoFocus
            />
            <button
              onClick={handleSubmit}
              disabled={submitting || !nickname.trim()}
              className="px-4 py-2 rounded-lg bg-[var(--brand-red)] text-white text-sm font-semibold hover:bg-[var(--brand-red-hover)] transition-colors disabled:opacity-50"
            >
              {submitting ? "..." : "OK"}
            </button>
          </div>
          {error && <p className="text-xs text-[var(--brand-red)] mt-1">{error}</p>}
        </div>
      )}

      {/* Leaderboard table */}
      {entries.length > 0 ? (
        <div className="space-y-1.5">
          {entries.map((entry, i) => (
            <div
              key={entry.id}
              className={`flex items-center justify-between px-3 py-2 rounded text-sm ${
                submitted && entry.nickname === nickname.trim() && entry.score === playerScore
                  ? "bg-[var(--brand-red)]/10 border border-[var(--brand-red)]/20"
                  : "bg-[var(--bg)]/50"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 text-center">
                  {i < 3 ? medals[i] : <span className="text-[var(--fg-dim)]">{i + 1}.</span>}
                </span>
                <span className="text-[var(--fg)] font-medium">{entry.nickname}</span>
              </div>
              <span className="font-bold text-[var(--fg-muted)]">{entry.score}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-[var(--fg-dim)] text-center py-2">
          Aucun score enregistré
        </p>
      )}
    </div>
  );
}
