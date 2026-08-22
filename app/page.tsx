import { tools, TOTAL_DAYS } from "@/lib/tools-registry";
import { ToolCard } from "@/components/tool-card";
import { ProgressTrack } from "@/components/progress-track";

export default function HomePage() {
  const shipped = tools.filter((t) => t.live);

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <section className="mb-14">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Day {shipped.length} of {TOTAL_DAYS}
        </p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-foreground sm:text-5xl">
          One small tool, shipped every day.
        </h1>
        <p className="mt-4 max-w-xl text-base text-muted-foreground">
          Thirty tiny, focused tools, one a day for thirty days. No sign-up, no bloat, no
          subscription — each one does a single job well and gets out of your way.
        </p>
        <div className="mt-8">
          <ProgressTrack shipped={shipped.length} total={TOTAL_DAYS} />
        </div>
      </section>

      <section>
        {shipped.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/50 px-6 py-10 text-center">
            <p className="font-display text-lg text-foreground">First tool ships soon.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Check back tomorrow morning — or follow along for the daily drop.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {shipped.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
