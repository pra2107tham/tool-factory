# House style — read this before building anything

You are building one tool inside an existing Next.js app used by dozens of other small, focused tools. Every day adds exactly one new tool. Follow this brief every time; the day's specific build brief comes after it and tells you *what* to build. This file tells you *how*.

## Scope discipline

Build exactly the 3 must-have features in today's brief. Do not add a 4th "while I'm at it" feature, an account system, a database, or anything on the non-goals list. A tool that does one thing extremely well, in under a minute, beats a tool that does five things adequately. If you're tempted to add scope, don't — note it in the PR description as a future idea instead.

Prefer processing entirely in the browser (WASM, client-side libraries) over a backend, wherever the task allows it. It's faster, free to run at any scale, and "your files never leave your browser" is both true and a genuinely good line in the copy.

## Design

Don't reach for the default AI look: a warm cream background with a serif headline and a terracotta accent, or a near-black page with one neon accent, or a hairline-rule newspaper layout. Those are fine directions in general, but they're defaults, not choices — pick a palette and type pairing that fits *this specific tool*, name 4-6 hex values, and justify the pairing before writing a line of CSS.

Give the page one signature moment — usually the tool itself, front and center, working within seconds of landing (a drop zone, a live preview, an instant result) — and keep everything else quiet around it. Mobile-first: most of this traffic arrives from a phone via a social link. Visible keyboard focus, respect reduced motion, no animation for its own sake.

Copy is part of the design. Say what the tool does in plain, active language — "reduce file size," not "optimize your assets." Buttons say what they do ("Compress file," not "Submit"). Empty and error states explain what happened and what to do next, in the product's own voice.

## SEO — non-negotiable per tool

- Unique `<title>` (under 60 characters) and meta description (under 160) from today's brief — written for a human first.
- One `<h1>` that matches what someone would actually search for.
- `opengraph-image.tsx` for a real OG image (import `ImageResponse` from `next/og` — see the root `app/opengraph-image.tsx` for the pattern to copy per tool, don't skip this).
- Register the route in `lib/tools-registry.ts` so it's picked up by the sitemap and homepage index automatically.
- Add `WebApplication` JSON-LD structured data to the page.
- Write 150-300 words of real on-page content: what the tool does, how it works, whether it's private/free. A bare upload box gives Google nothing to match a query against — this paragraph is the single highest-leverage SEO element on the page, more than any meta tag.
- Link to 2-3 related tools from `lib/tools-registry.ts`, and back to the homepage.
- Canonical URL tag. No duplicate routes for the same tool.

## Definition of done

Before opening the PR, confirm all of these are true:
- `npm run build` passes with no errors.
- The core flow works end to end (test it with a real file/input, not just a stub).
- Responsive from 375px wide up.
- The tool is registered in `lib/tools-registry.ts` with its title, one-liner, and slug.
- Every item in the SEO section above is present.
- The PR description states what you built, any assumption you made, and anything from the brief you deliberately left out.
