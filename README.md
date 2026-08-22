# Tool Factory

One small tool, shipped every day, for 30 days — built by an automated daily
pipeline and shipped by you.

Start here: [`ARCHITECTURE.md`](./ARCHITECTURE.md) — the full pipeline, the
day-0 setup checklist, and the reasoning behind each decision.

```
app/            the site (homepage, sitemap, robots, one route per tool)
components/     shared header, footer, tool card, progress tracker
lib/            tools-registry.ts — single source of truth for every tool
prompts/        house-style.md (every build reads this) + social-copy.md
scripts/        daily-pipeline.ts — the orchestrator (build + announce)
.github/        the cron workflow that runs it every morning
```

## Local dev

```
npm install
npm run dev
```

## Adding today's tool by hand (before you trust the cron)

```
npx tsx scripts/daily-pipeline.ts build
```
