import type { Metadata } from "next";
import Link from "next/link";
import { relatedTools } from "@/lib/tools-registry";
import { Formatter } from "./formatter";

const URL_PATH = "/tools/json-formatter";

export const metadata: Metadata = {
  // `absolute` skips the layout's "— Tool Factory" template, which would push
  // this past 60 characters.
  title: { absolute: "JSON Formatter — Validate & Pretty-Print JSON Online" },
  description:
    "Paste messy JSON and get it formatted and validated instantly. Errors show the exact line and column. Free, no signup, runs entirely in your browser.",
  alternates: { canonical: URL_PATH },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "JSON Formatter",
  url: `https://tool-factory-lac.vercel.app${URL_PATH}`,
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any",
  description:
    "Pretty-print and validate JSON in the browser. Paste minified or broken JSON and see it formatted with two-space indentation as you type, or minified back down with one toggle. Invalid JSON reports the parser's message plus the exact line and column of the failure, and jumps to that line in the input. Copy the result or download it as a .json file. Nothing is uploaded.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function JsonFormatterPage() {
  const related = relatedTools("json-formatter");

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="mb-8">
        <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">Day 08</p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-foreground sm:text-5xl">
          Format and validate JSON online
        </h1>
        <p className="mt-4 max-w-xl text-base text-muted-foreground">
          Paste a wall of minified JSON and read it. If it&rsquo;s broken, the status bar
          turns amber and tells you the line and column that broke it.
        </p>
      </header>

      <Formatter />

      <section className="mt-16 max-w-2xl space-y-4 text-sm leading-relaxed text-muted-foreground">
        <h2 className="font-display text-2xl text-foreground">How this JSON formatter works</h2>
        <p>
          Paste JSON into the left box and the formatted version appears on the right,
          indented two spaces, a moment after you stop typing. There is no Format button:
          the tool parses continuously, so the status bar at the top is always telling you
          whether what you have right now is valid. Flip the Minify toggle and the same box
          runs the other direction, stripping every space and newline for a config value or
          a URL parameter.
        </p>
        <p>
          When the JSON doesn&rsquo;t parse, you get the part that actually matters: the
          parser&rsquo;s own message — <em>Expected &rsquo;,&rsquo; or &rsquo;&rbrace;&rsquo;
          after property value</em>, <em>Unexpected token</em>,{" "}
          <em>Unexpected end of JSON input</em>{" "}
          — plus the line and column where it gave up, worked out from the character offset
          your browser reports. The line number lights up in the gutter, and
          &ldquo;Jump to line&rdquo; selects it in the input so you can fix it without
          counting rows. That&rsquo;s usually a trailing comma, a single quote where a double
          belongs, or an unquoted key.
        </p>
        <p>
          Everything happens in your browser using the built-in <code>JSON.parse</code> —
          the same parser your code will use. Your JSON is never uploaded, logged, or sent
          anywhere, which matters when the thing you&rsquo;re debugging is an API response
          with a token or a customer record in it. Copy the result to the clipboard, or
          download it as a <code>.json</code> file.
        </p>
        <p>
          It&rsquo;s free, has no sign-up, and no size limit beyond what your browser can
          hold in memory. Working with text more than data? The{" "}
          <Link
            href="/tools/word-counter"
            className="text-primary underline-offset-4 hover:underline"
          >
            Word Counter
          </Link>{" "}
          counts as you type, and the{" "}
          <Link
            href="/tools/qr-code-generator"
            className="text-primary underline-offset-4 hover:underline"
          >
            QR Code Generator
          </Link>{" "}
          turns a link into a code that never expires.
        </p>
      </section>

      {related.length > 0 && (
        <section className="mt-12 border-t border-border pt-6">
          <h2 className="font-display text-lg text-foreground">Other tools</h2>
          <ul className="mt-3 space-y-2">
            {related.map((tool) => (
              <li key={tool.slug} className="text-sm">
                <Link
                  href={`/tools/${tool.slug}`}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {tool.title}
                </Link>
                <span className="text-muted-foreground"> — {tool.oneLiner}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <nav className="mt-12 border-t border-border pt-6">
        <Link href="/" className="text-sm text-primary underline-offset-4 hover:underline">
          ← All tools
        </Link>
      </nav>
    </div>
  );
}
