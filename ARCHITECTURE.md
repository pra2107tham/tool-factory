# Tool Factory — architecture

30 days, 30 tiny tools, one pipeline. Every morning a cron job picks the next idea off the sheet, drafts a build brief, and hands it to Claude Code to build. You review, merge, and push it live yourself. Once it's live, you run one command and get draft posts for X and LinkedIn.

## The one call worth debating: one app, not 30 repos

Your original framing was "Claude creates a GitHub repo" per idea. I'd push back on that and build all 30 tools as routes inside **one** Next.js app instead (`app/tools/<slug>/`). Reasons, roughly in order of how much they matter:

- **Domain authority compounds.** Thirty fresh domains all start at zero and stay split thirty ways forever. One domain, growing by a route a day, is the single best thing you can do for the "SEO-friendly" requirement — see the SEO section below for why that still isn't a fast win.
- **Free internal linking.** Every tool page can link to two or three siblings ("also try..."). That's real crawl discovery and real repeat pageviews, and it only exists if everything lives under one roof.
- **One deploy pipeline, one design system.** You maintain the header, footer, and build brief once — not thirty times. That matters when you're shipping daily and can't afford setup tax on day 12.
- **The default `GITHUB_TOKEN` is enough.** Because the daily job only ever branches and PRs inside one repo, it doesn't need a personal access token with repo-creation rights — a real, if small, security win.
- **Nothing is lost.** If one tool actually takes off, pulling it into its own repo and domain later is a twenty-minute copy-paste, not a rebuild.

If you'd genuinely rather each tool be a fully independent, sellable, open-sourceable unit from day one, the pipeline below still works — swap "open a PR in this repo" for "create a new repo and connect a new Vercel project," and expect roughly 30x the setup ceremony (a new Vercel project, a new domain or subdomain, a duplicated design system per repo) for that independence. I think the tradeoff favors one app for a 30-day sprint, but it's your call to override.

## Repo layout

```
your-repo/
├── .github/workflows/daily-build.yml
├── app/
│   ├── page.tsx                  # homepage: lists all shipped tools
│   ├── sitemap.ts                # auto-includes every tool route
│   ├── robots.ts
│   └── tools/
│       └── <slug>/
│           ├── page.tsx
│           └── opengraph-image.tsx   # @vercel/og, one line of branding per tool
├── components/                   # shared header, footer, tool card
├── lib/
│   └── tools-registry.ts         # single source of truth: slug, title, description, status
├── prompts/
│   ├── house-style.md            # the standing brief — every day's build reads this
│   └── social-copy.md            # the prompt for the announce step
└── scripts/
    └── daily-pipeline.ts         # build + announce
```

`lib/tools-registry.ts` drives the homepage index, the sitemap, and the internal cross-links — it's the one file every day's PR has to touch.

## Loop A — the automated build (runs unattended)

1. **06:30 IST, GitHub Actions cron fires** `daily-build.yml`.
2. **Pick the next idea.** The script reads the sheet, finds the first row with `built = N`.
3. **Draft a build brief.** A plain Claude API call (not Claude Code) expands the raw idea into: target user, exactly 3 must-have features, exactly 2 explicit non-goals, a slug, 5 target long-tail keywords, a title tag and meta description. The 3-features/2-non-goals constraint is what keeps day 19's tool from quietly growing into a SaaS platform.
4. **Claude Code builds it.** Runs headless (`claude -p`) on a new branch, reading `prompts/house-style.md` plus today's brief. It adds the route, registers the tool, and has to get `npm run build` passing before it's done — that's a hard requirement in the brief, not a suggestion.
5. **Opens a PR.** `gh pr create`, with a description of what got built (and a screenshot, if you add the Playwright step below).
6. **Vercel auto-builds a preview** and comments the URL on the PR. Free, no config beyond connecting the repo once.
7. The sheet gets `built = Y` and the PR link written back.

**A worthwhile add-on:** a Playwright screenshot step (desktop + mobile width) attached to the PR description. You already know Playwright from the Nomura validation agent — same idea, just pointed at localhost instead of a trading UI. It means you can often approve from the PR description alone, without opening the preview link first.

## Loop B — your call (you trigger every step)

1. **You review the PR** — read the description, open the Vercel preview, poke at it on your phone.
2. **You merge.** This is the approval gate you asked for.
3. **You promote to production.** Vercel's default is: merge to `main` → live immediately, which already satisfies "I ship it myself" since merging is your own deliberate action. If you want a second, separate "I'm choosing to ship *now*" moment distinct from "I approved this code," Vercel also supports disabling auto-promotion on the production branch so merging only builds, and you promote a specific deployment from the dashboard when you're ready.
4. **You run the announce command** once it's live:
   ```
   npx tsx scripts/daily-pipeline.ts announce --slug=file-size-reducer --url=https://yourdomain.com/tools/file-size-reducer
   ```
   Claude reads `prompts/social-copy.md` and drafts an X post and a LinkedIn post. They land in the sheet and print to your terminal — you copy, tweak, post.

## Sheet schema

| column | example | who writes it |
|---|---|---|
| `id` | 1 | you, when seeding |
| `title` | File Size Reducer | you |
| `one_liner` | Drop any file, get 3 smaller versions instantly | you |
| `notes` | (competitor links, constraints) | you, optional |
| `built` | Y / N | pipeline, after PR opens |
| `pr_url` | | pipeline |
| `merged` | Y / N | you (or a webhook later) |
| `deployed` | Y / N | you |
| `live_url` | | you |
| `shipped_social` | Y / N | pipeline, after announce |
| `date_built` / `date_shipped` | | pipeline |

## Secrets

`ANTHROPIC_API_KEY`, `GOOGLE_SERVICE_ACCOUNT_KEY` + `SHEET_ID` (share the sheet with the service account's email), and the default `GITHUB_TOKEN` — no PAT needed, because of the one-repo decision above.

## Safety limits (worth stealing from your own job-agent)

You already put hard caps on the browser-use job application agent — step ceiling, cost abort, loop-hash detection. Same logic applies here, and it's cheap to add:

- **`--max-turns`** on the `claude -p` call, so a confused run can't spiral into an expensive loop.
- **`--allowedTools`** scoped to `Edit,Bash` (or narrower), never a blanket "do anything" grant — even inside an ephemeral CI container.
- **A build timeout** on the GitHub Actions job (45 min is generous for a tool this small) so a stuck run doesn't burn the whole day.
- **A PR, never a direct push to `main`.** This is really the master safety limit — nothing goes live without you looking at it once.

## SEO: what it will and won't do for you

Everything in the house-style brief (metadata, sitemap, semantic headings, schema markup, real on-page copy) is worth doing, and it's built into every day's brief. But be honest about the timeline: a brand-new domain doesn't rank meaningfully in 30 days no matter how clean the on-page work is — Google needs to trust the domain first, and that takes months and some real backlinks, not days. On-page SEO here is a compounding bet for month 3 through 12, as the tool index grows and cross-links itself.

For actual 30-day traffic, distribution is doing the work: your X/LinkedIn posts, and possibly Show HN or a relevant subreddit for the tools that fit. Which is also why "ship 30 tools in 30 days" is worth telling as one narrative across the month (Day 4/30, Day 5/30...) rather than 30 unconnected launch posts — it's a much stronger hook, and it doubles as a live signal for recruiters and prospective compliance clients watching your LinkedIn.

## Day-0 checklist

- [ ] Pick the domain/brand (the one thing only you can decide — send it over and I'll wire the placeholders)
- [ ] `create-next-app` with TypeScript + Tailwind + App Router, add shadcn/ui
- [ ] Build the shared shell: header, footer, homepage index reading `lib/tools-registry.ts`
- [ ] `app/sitemap.ts` + `app/robots.ts`
- [ ] Push to GitHub, connect the repo to Vercel, connect the domain
- [ ] Decide: auto-promote on merge, or a separate manual promote step (see Loop B)
- [ ] Create the Google Sheet from the schema above, share it with the service account email
- [ ] Add the three secrets
- [ ] Drop in `daily-build.yml`, `daily-pipeline.ts`, and the two prompt files
- [ ] Seed all 30 rows
- [ ] Run the pipeline by hand once before you trust the cron with it

## What I'd build next

- A webhook on PR merge that flips `merged = Y` automatically, so the sheet never drifts from GitHub's actual state.
- Re-invoking Claude Code on your PR review comments, so "fix the mobile layout" becomes a second commit instead of a manual edit.
- The Playwright screenshot step mentioned above.
- Auto-posting via Zapier once you trust the drafts enough to skip the copy-paste — you're already connected to Zapier.
