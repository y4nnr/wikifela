"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const triggerSearch = useCallback(
    (q: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      onSearch(q);
    },
    [onSearch]
  );

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onSearch(value);
    }, 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, onSearch]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        triggerSearch(value);
      }}
      className="w-full flex justify-center px-4"
    >
      <div
        className={`flex items-center w-full max-w-xl rounded-full border transition-shadow bg-[var(--bg-input)] ${
          focused
            ? "shadow-lg shadow-black/30 border-[var(--border-hover)]"
            : "border-[var(--border)] hover:shadow-lg hover:shadow-black/30"
        }`}
      >
        <svg
          className="ml-4 mr-2 text-[var(--fg-dim)] shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Rechercher une affaire, un nom, un lieu..."
          autoFocus
          className="w-full py-3 pr-4 text-base bg-transparent outline-none text-[var(--fg)] placeholder:text-[var(--fg-dim)]"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              setValue("");
              triggerSearch("");
            }}
            className="mr-3 text-[var(--fg-dim)] hover:text-[var(--fg-muted)] shrink-0"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
    </form>
  );
}
