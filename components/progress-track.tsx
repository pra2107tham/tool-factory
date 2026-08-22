export function ProgressTrack({ shipped, total }: { shipped: number; total: number }) {
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            aria-hidden="true"
            className={
              i < shipped
                ? "h-2.5 w-2.5 rounded-full bg-primary"
                : "h-2.5 w-2.5 rounded-full border border-border"
            }
          />
        ))}
      </div>
      <p className="mt-2 font-mono text-xs text-muted-foreground">
        {shipped} / {total} shipped
      </p>
    </div>
  );
}
