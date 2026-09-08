import type { Metadata } from "next";
import Link from "next/link";
import { relatedTools } from "@/lib/tools-registry";
import { Counter } from "./counter";

const URL_PATH = "/tools/word-counter";

export const metadata: Metadata = {
  // `absolute` skips the layout's "— Tool Factory" template, which would push
  // this past 60 characters.
  title: { absolute: "Word Counter — Live Word, Character & Reading Time" },
  description:
    "Count words, characters, and reading time as you type. Free, instant, and private — your text never leaves your browser.",
  alternates: { canonical: URL_PATH },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Word Counter",
  url: `https://tool-factory-lac.vercel.app${URL_PATH}`,
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Any",
  description:
    "Count words, characters with and without spaces, sentences, and paragraphs as you type, with reading time at 200 wpm and speaking time at 130 wpm. Set a target — a 280-character tweet, a 160-character meta description, a 500-word essay, or your own — and see how many words you have left. Runs entirely in your browser.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function WordCounterPage() {
  const related = relatedTools("word-counter");

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="mb-8">
        <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
          Day 07
        </p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-foreground sm:text-5xl">
          Word Counter
        </h1>
        <p className="mt-4 max-w-xl text-base text-muted-foreground">
          Paste your text and the numbers are already there — words, characters,
          sentences, paragraphs, and how long it takes to read. Set a limit and see
          exactly how far off you are.
        </p>
      </header>

      <Counter />

      <section className="mt-16 max-w-2xl space-y-4 text-sm leading-relaxed text-muted-foreground">
        <h2 className="font-display text-2xl text-foreground">
          How this word counter works
        </h2>
        <p>
          Type or paste into the box and every count updates on the same keystroke:
          words, characters with spaces, characters without spaces, sentences, and
          paragraphs. There is no Count button and no delay, because the counting
          happens in your browser rather than on a server somewhere. That also means
          your draft, your cover letter, or your client&rsquo;s copy never leaves your
          device — nothing is uploaded, stored, or logged.
        </p>
        <p>
          Words are split the way your operating system splits them, using the browser&rsquo;s
          own text segmenter rather than counting the gaps between spaces. It gets the
          cases a space-counter gets wrong: <em>state-of-the-art</em> is one word,{" "}
          <em>it&rsquo;s</em> is one word, an em dash on its own is none, and Chinese,
          Japanese, and Thai — which don&rsquo;t put spaces between words at all — are
          counted properly instead of coming back as one enormous word.
        </p>
        <p>
          Reading time assumes 200 words per minute, which is a common average for adults
          reading silently on a screen. Speaking time assumes 130, roughly the pace of an
          unhurried presentation, so it is the number to trust for a talk, a script, or a
          three-minute pitch. Both are estimates: dense technical writing reads slower,
          and a familiar topic reads faster.
        </p>
        <p>
          The target bar handles the deadline question. Pick a tweet (280 characters), a
          meta description (160), a 500-word essay, or type your own limit in words or
          characters, and the bar tells you &ldquo;142 to go&rdquo; until you cross it and
          &ldquo;23 over&rdquo; after. It is free, has no sign-up, and no limit on how much
          text you paste. Working on the document itself? The{" "}
          <Link
            href="/tools/pdf-merger"
            className="text-[#2F5FE0] underline-offset-4 hover:underline"
          >
            PDF Merger
          </Link>{" "}
          joins your chapters into one file, and the{" "}
          <Link
            href="/tools/qr-code-generator"
            className="text-[#2F5FE0] underline-offset-4 hover:underline"
          >
            QR Code Generator
          </Link>{" "}
          turns the finished link into a code for the handout.
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
