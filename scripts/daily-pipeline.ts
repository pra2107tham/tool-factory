#!/usr/bin/env node
/**
 * Tool Factory daily pipeline.
 *
 * Two modes:
 *   build     — cron-triggered. Picks the next un-built idea from ideas.json,
 *               drafts a build brief, runs Claude Code on a new branch, and
 *               opens a PR.
 *   announce  — you run this by hand once a tool is live in production.
 *               Drafts X + LinkedIn posts and prints/writes them for you.
 *
 * Ideas live in ideas.json (repo-tracked — see the schema there), not a
 * Google Sheet: one file, no service account, no sharing to manage. Run this
 * locally once before you let the cron run it unattended:
 *
 *   npx tsx scripts/daily-pipeline.ts build
 */

import { execSync, spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const IDEAS_PATH = "ideas.json";

// One call site for every "ask Claude for text back" step. Runs through the
// `claude` CLI (not the SDK) so it rides your subscription login locally —
// ANTHROPIC_API_KEY is only required where there's no browser to log in
// with, i.e. the unattended GitHub Actions cron.
function askClaude(prompt: string, opts: { allowedTools?: string; maxTurns?: number } = {}): string {
  const args = [
    "-p", prompt,
    "--output-format", "json",
    "--effort", "high",
    "--max-turns", String(opts.maxTurns ?? 1),
  ];
  // Text-only calls (drafting a brief, drafting social copy) get no tool
  // access at all. Only the build step, which actually edits files, needs
  // --allowedTools and acceptEdits so it doesn't hang waiting for approval.
  if (opts.allowedTools) {
    args.push("--allowedTools", opts.allowedTools, "--permission-mode", "acceptEdits");
  }
  // --effort pins a level valid for non-thinking models, overriding a
  // personal ~/.claude/settings.json effortLevel (e.g. "xhigh") that would
  // otherwise 400 here. --bare is skipped: on at least one CLI version it
  // breaks subscription-login auth resolution for `-p` specifically.
  const result = spawnSync("claude", args, {
    encoding: "utf-8",
    stdio: ["inherit", "pipe", "inherit"],
    env: { ...process.env, CLAUDE_CODE_EFFORT_LEVEL: "high" },
  });
  if (result.error) {
    throw new Error(`claude -p failed to spawn: ${result.error.message}`);
  }
  let parsed: { is_error?: boolean; result?: string };
  try {
    parsed = JSON.parse(result.stdout);
  } catch {
    throw new Error(
      `claude -p exited ${result.status}, non-JSON output:\n${result.stdout}`
    );
  }
  if (result.status !== 0 || parsed.is_error) {
    throw new Error(`claude -p failed: ${parsed.result ?? result.stdout}`);
  }
  return parsed.result as string;
}

// ---------- idea storage (ideas.json in the repo — see ideas.schema.md) ----------

type Idea = {
  id: number;
  title: string;
  oneLiner: string;
  notes: string;
  built: "Y" | "N";
  prUrl: string;
  merged: "Y" | "N";
  deployed: "Y" | "N";
  liveUrl: string;
  shippedSocial: "Y" | "N";
  dateBuilt: string;
  dateShipped: string;
};

function readIdeas(): Idea[] {
  return JSON.parse(readFileSync(IDEAS_PATH, "utf-8"));
}

function writeIdeas(ideas: Idea[]) {
  writeFileSync(IDEAS_PATH, JSON.stringify(ideas, null, 2) + "\n");
}

async function getNextIdea(): Promise<Idea | null> {
  const ideas = readIdeas();
  return ideas.find((i) => i.built !== "Y") ?? null;
}

async function markBuilt(id: number, prUrl: string) {
  const ideas = readIdeas();
  const idea = ideas.find((i) => i.id === id);
  if (!idea) throw new Error(`ideas.json: no idea with id ${id}`);
  idea.built = "Y";
  idea.prUrl = prUrl;
  idea.dateBuilt = new Date().toISOString().slice(0, 10);
  writeIdeas(ideas);
  // Commit the status update directly — the daily-build workflow runs on a
  // branch that gets PR'd, so this rides along in the same PR as the tool.
  execSync(`git add ${IDEAS_PATH} && git commit -m "Mark idea ${id} built"`, {
    stdio: "inherit",
  });
}

// ---------- step 1: idea -> build brief ----------

async function draftBrief(idea: Idea): Promise<string> {
  const houseStyle = readFileSync("prompts/house-style.md", "utf-8");
  return askClaude(`${houseStyle}

Today's raw idea
Title: ${idea.title}
One-liner: ${idea.oneLiner}
Notes: ${idea.notes || "(none)"}

Expand this into a build brief: target user in one sentence, exactly 3
must-have features, exactly 2 explicit non-goals, a URL slug, 5 target
long-tail keywords, a <title> under 60 characters, and a meta description
under 160 characters. Keep it tight — the whole point is this ships today.`);
}

// ---------- step 2: build it with Claude Code ----------

function buildWithClaudeCode(brief: string, slug: string): string {
  const branch = `tool/${slug}`;
  execSync(`git checkout -b ${branch}`, { stdio: "inherit" });

  const houseStyle = readFileSync("prompts/house-style.md", "utf-8");
  const prompt = `${houseStyle}

${brief}

Build this now. Add it under app/tools/${slug}/, register it in
lib/tools-registry.ts, and confirm \`npm run build\` passes before you finish.`;

  // --allowedTools scopes exactly what it can touch — never a blanket grant.
  // --max-turns 60 is the cost/runaway cap, same idea as the step ceiling on
  // your job-application agent.
  askClaude(prompt, { allowedTools: "Edit,Bash", maxTurns: 60 });

  execSync(`git push -u origin ${branch}`, { stdio: "inherit" });
  const pr = spawnSync(
    "gh",
    [
      "pr", "create",
      "--title", `New tool: ${slug}`,
      "--body", "Built from today's brief. The Vercel preview link will show up as a comment on this PR once the build finishes.",
      "--base", "main",
      "--head", branch,
    ],
    { encoding: "utf-8" }
  );
  return pr.stdout?.trim() ?? "";
}

// ---------- step 3: announce (you trigger this) ----------

async function announce(slug: string, liveUrl: string) {
  const socialPrompt = readFileSync("prompts/social-copy.md", "utf-8");
  const text = askClaude(`${socialPrompt}\n\nTool: ${slug}\nLive at: ${liveUrl}`);
  console.log(text);
}

// ---------- entry point ----------

async function main() {
  const [, , mode, ...rest] = process.argv;
  const arg = (name: string) => rest.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];

  if (mode === "build") {
    const idea = await getNextIdea();
    if (!idea) {
      console.log("No un-built ideas left in ideas.json.");
      return;
    }
    const brief = await draftBrief(idea);
    const slug = idea.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
    const prUrl = buildWithClaudeCode(brief, slug);
    await markBuilt(idea.id, prUrl);
  } else if (mode === "announce") {
    const slug = arg("slug");
    const url = arg("url");
    if (!slug || !url) {
      console.error("Usage: daily-pipeline.ts announce --slug=<slug> --url=<live url>");
      process.exit(1);
    }
    await announce(slug, url);
  } else {
    console.error("Usage: daily-pipeline.ts <build|announce> [--slug=... --url=...]");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
