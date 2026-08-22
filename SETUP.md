# Setup

Everything below assumes Node 20+, git, the GitHub CLI (`gh`), and the Claude Code CLI available on your machine. Do these once, in order.

## 1. Local install

```
cd tool-factory
npm install
npm run dev
```

Open `http://localhost:3000` — you should see the empty-state homepage ("First tool ships soon").

## 2. Push to GitHub

```
git init -b main
git add .
git commit -m "Initial scaffold"
gh repo create tool-factory --private --source=. --remote=origin --push
```

No `gh` CLI? Create the repo on github.com first, then:

```
git remote add origin https://github.com/<you>/tool-factory.git
git push -u origin main
```

## 3. Connect Vercel

- Go to vercel.com/new, import the repo, deploy. The first deploy goes live immediately at `<project>.vercel.app` — you don't need a domain picked yet.
- Have a domain already? Project → Settings → Domains → add it.
- Want a separate "I decide when this goes live" moment, distinct from merging? Project → Settings → Git → look for the production-branch auto-assignment toggle and turn it off, then promote deployments manually from the dashboard when ready. Otherwise merge = live, which is simpler and still entirely your call.

## 4. Give the pipeline access to Google Sheets

- console.cloud.google.com → a project (new or existing) → APIs & Services → Library → enable **Google Sheets API**.
- IAM & Admin → Service Accounts → Create Service Account (any name works, e.g. `tool-factory-bot`).
- Open it → Keys → Add key → Create new key → JSON. This downloads a `.json` file — treat it as a credential, don't commit it.
- Create your Google Sheet. Name the tab **`Ideas`** exactly (the script reads that literal tab name). Row 1 = headers matching the schema in `ARCHITECTURE.md`; rows 2–31 = your 30 ideas.
- Share the sheet with the service account's email — it's the `client_email` field inside the JSON file, something like `tool-factory-bot@your-project.iam.gserviceaccount.com`. Give it Editor access, or the pipeline can't write statuses back.

## 5. Add the GitHub Actions secrets

Repo → Settings → Secrets and variables → Actions → New repository secret:

| secret | where it comes from |
|---|---|
| `ANTHROPIC_API_KEY` | console.anthropic.com |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | paste the entire contents of the JSON key file from step 4 |
| `SHEET_ID` | the long ID in your sheet's URL, between `/d/` and `/edit` |

`GITHUB_TOKEN` needs nothing from you — GitHub provides it automatically for every run, and the workflow already requests the right permissions for it.

## 6. Dry run before you trust the cron

```
npm install -g @anthropic-ai/claude-code
gh auth login
export ANTHROPIC_API_KEY=...
export GOOGLE_SERVICE_ACCOUNT_KEY="$(cat /path/to/your-key.json)"
export SHEET_ID=...
npx tsx scripts/daily-pipeline.ts build
```

This should read row 2 of your sheet, draft a build brief, run Claude Code on a new branch, and open a real PR against `main`. Watch it happen once, end to end, before the 6:30am cron does it unattended.

## 7. Let the cron take over

Nothing left to do — `.github/workflows/daily-build.yml` is already in the repo and already scheduled. Check the repo's Actions tab tomorrow morning.

## 8. Your loop, every day after

Review the PR and its Vercel preview → merge → promote to production (skip this if you turned off the extra gate in step 3) → then:

```
npx tsx scripts/daily-pipeline.ts announce --slug=<slug> --url=<live url>
```
