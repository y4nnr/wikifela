interface GameProcedureDiagramProps {
  title: string;
  subtitle: string;
  tileCount?: number;
}

export default function GameProcedureDiagram({
  title,
  subtitle,
  tileCount = 4,
}: GameProcedureDiagramProps) {
  const tiles = Array.from({ length: tileCount }, (_, i) => i + 1);
  return (
    <div className="border border-[var(--border)] rounded bg-[var(--bg-card)] p-4 text-center">
      <div className="text-[10px] text-[var(--fg-dim)] uppercase tracking-wider mb-3">
        {title}
      </div>
      <div className="flex justify-center gap-2 sm:gap-3 mb-3">
        {tiles.map((n) => (
          <div
            key={n}
            className="w-10 h-12 sm:w-12 sm:h-14 border border-[var(--border)] rounded bg-[var(--bg)] flex items-end justify-center pb-1"
          >
            <span className="text-[10px] text-[var(--fg-dim)]">{n}</span>
          </div>
        ))}
      </div>
      <div className="text-[10px] text-[var(--fg-dim)]">{subtitle}</div>
    </div>
  );
}
