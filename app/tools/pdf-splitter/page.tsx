import type { Metadata } from "next";
import Link from "next/link";
import { relatedTools } from "@/lib/tools-registry";
import { Splitter } from "./splitter";

const URL_PATH = "/tools/pdf-splitter";

export const metadata: Metadata = {
  // `absolute` skips the layout's "— Tool Factory" template, which would
  // otherwise push this past 60 characters.
  title: { absolute: "PDF Splitter — Extract Pages From a PDF, Free" },
  description:
    "Pull specific pages out of a PDF into a new file. Pick pages visually or type a range like 1-3, 7. Free, no signup, and your file never leaves your browser.",
  alternates: { canonical: URL_PATH },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "PDF Splitter",
  url: `https://tool-factory-lac.vercel.app${URL_PATH}`,
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Any",
  description:
    "Extract pages from a PDF in your browser. Drop a PDF, pick pages from a thumbnail grid or type a range, and download just those pages as a new file. Nothing is uploaded.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function PdfSplitterPage() {
  const related = relatedTools("pdf-splitter");

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="mb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Day 03
        </p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-foreground sm:text-5xl">
          Extract pages from a PDF
        </h1>
        <p className="mt-4 max-w-xl text-base text-muted-foreground">
          Drop in a PDF, tap the pages you want, and download just those pages as a new file.
          Nothing is uploaded anywhere.
        </p>
      </header>

      <Splitter />

      <section className="mt-16 max-w-2xl space-y-4 text-sm leading-relaxed text-muted-foreground">
        <h2 className="font-display text-2xl text-foreground">How this PDF splitter works</h2>
        <p>
          A 40-page scanned packet where somebody only needs pages 12 to 15. A signed contract
          where one page has the signature on it. A bank statement where a single month is all
          the landlord asked for. This tool takes one page out of a PDF, or a handful, and
          gives you those pages back as a separate file.
        </p>
        <p>
          Drop the PDF in and every page renders as a thumbnail with its number, usually within
          a second or two. Tap a page to select it and tap again to deselect. If you already
          know the pages you want, type them into the box instead — <code>1-3, 7, 12-15</code>{" "}
          works exactly as it looks. Typing highlights the thumbnails and tapping thumbnails
          rewrites the text, so both always show the same selection.
        </p>
        <p>
          Press the download button and the selected pages are saved as{" "}
          <code>&lt;original&gt;-pages.pdf</code>, always in page order no matter which order
          you picked them in. Rendering uses pdf.js and the new file is assembled with pdf-lib,
          both inside your browser — the document is never uploaded, sent to a server, or
          stored. That matters more here than with most file tools, because the PDFs people cut
          down are usually the private ones: contracts, payslips, medical letters, passport
          scans. It is free, there is no sign-up, and there is no page limit.
        </p>
        <p>
          This tool extracts pages and nothing else — it does not rotate, reorder, compress or
          delete pages, and it produces one PDF rather than bursting a file into many. If you
          need to go the other way and join several PDFs together, the{" "}
          <Link
            href="/tools/pdf-merger"
            className="text-[#2E6FD9] underline-offset-4 hover:underline"
          >
            PDF Merger
          </Link>{" "}
          does that. Password-protected PDFs can&rsquo;t be opened here; remove the password in
          whatever app made the file, then drop it in again.
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
