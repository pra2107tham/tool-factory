#!/usr/bin/env node
/**
 * Tool Factory daily pipeline.
 *
 * Two modes:
 *   build     — cron-triggered. Picks the next un-built idea from the sheet,
 *               drafts a build brief, runs Claude Code on a new branch, and
 *               opens a PR.
 *   announce  — you run this by hand once a tool is live in production.
 *               Drafts X + LinkedIn posts and prints/writes them for you.
 *
 * This is a skeleton. Fill in the TODOs (sheet column mapping matches the
 * schema in ARCHITECTURE.md) and run this locally once before you let the
 * cron run it unattended:
 *
 *   npx tsx scripts/daily-pipeline.ts build
 */

import { google } from "googleapis";
import { execSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import Anthropic from "@anthropic-ai/sdk";

const SHEET_ID = process.env.SHEET_ID!;
const anthropic = new Anthropic(); // reads ANTHROPIC_API_KEY from env

// ---------- sheet access ----------

async function sheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

type IdeaRow = {
  rowIndex: number; // 1-based sheet row, needed to write status back
  title: string;
  oneLiner: string;
  notes: string;
};

async function getNextIdea(): Promise<IdeaRow | null> {
  const sheets = await sheetsClient();
  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "Ideas!A2:E", // columns: id | title | one_liner | notes | built
  });
  const rows = data.values ?? [];
  for (let i = 0; i < rows.length; i++) {
    const [, title, oneLiner, notes, built] = rows[i];
    if ((built ?? "N").trim().toUpperCase() !== "Y") {
      return { rowIndex: i + 2, title, oneLiner, notes: notes ?? "" };
    }
  }
  return null;
}

async function markBuilt(rowIndex: number, prUrl: string) {
  const sheets = await sheetsClient();
  // built = column E, pr_url = column F
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `Ideas!E${rowIndex}:F${rowIndex}`,
    valueInputOption: "RAW",
    requestBody: { values: [["Y", prUrl]] },
  });
}

// ---------- step 1: idea -> build brief ----------

async function draftBrief(idea: IdeaRow): Promise<string> {
  const houseStyle = readFileSync("prompts/house-style.md", "utf-8");
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1200,
    messages: [
      {
        role: "user",
        content: `${houseStyle}

Today's raw idea
Title: ${idea.title}
One-liner: ${idea.oneLiner}
Notes: ${idea.notes || "(none)"}

Expand this into a build brief: target user in one sentence, exactly 3
must-have features, exactly 2 explicit non-goals, a URL slug, 5 target
long-tail keywords, a <title> under 60 characters, and a meta description
under 160 characters. Keep it tight — the whole point is this ships today.`,
      },
    ],
  });
  return msg.content.map((b) => (b.type === "text" ? b.text : "")).join("\n");
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

  // Flags verified against Claude Code's own docs (code.claude.com/docs/en/headless):
  //  -p                     run non-interactively, print the result, exit
  //  --allowedTools         scope exactly what it can touch — never a blanket grant
  //  --permission-mode      acceptEdits so it doesn't hang waiting for approval
  //  --output-format json   structured result your script can branch on
  //  --bare                 skip hook/skill auto-discovery — same behavior every CI run
  //  --max-turns            cost/runaway cap, same idea as the step ceiling on your
  //                         job-application agent
  const result = spawnSync(
    "claude",
    [
      "-p", prompt,
      "--allowedTools", "Edit,Bash",
      "--permission-mode", "acceptEdits",
      "--output-format", "json",
      "--bare",
      "--max-turns", "60",
    ],
    { stdio: "inherit" }
  );
  if (result.status !== 0) {
    throw new Error("Claude Code build failed — check the job log");
  }

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
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 800,
    messages: [
      { role: "user", content: `${socialPrompt}\n\nTool: ${slug}\nLive at: ${liveUrl}` },
    ],
  });
  const text = msg.content.map((b) => (b.type === "text" ? b.text : "")).join("\n");
  console.log(text);
  // TODO: also write `text` into the sheet's twitter_draft / linkedin_draft
  // columns if you want it there instead of just in the terminal.
}

// ---------- entry point ----------

async function main() {
  const [, , mode, ...rest] = process.argv;
  const arg = (name: string) => rest.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];

  if (mode === "build") {
    const idea = await getNextIdea();
    if (!idea) {
      console.log("No un-built ideas left in the sheet.");
      return;
    }
    const brief = await draftBrief(idea);
    const slug = idea.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
    const prUrl = buildWithClaudeCode(brief, slug);
    await markBuilt(idea.rowIndex, prUrl);
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
