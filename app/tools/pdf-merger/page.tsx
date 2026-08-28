import type { Metadata } from "next";
import Link from "next/link";
import { relatedTools } from "@/lib/tools-registry";
import { Merger } from "./merger";

const URL_PATH = "/tools/pdf-merger";

export const metadata: Metadata = {
  // `absolute` skips the layout's "— Tool Factory" template, which would
  // otherwise push this past 60 characters.
  title: { absolute: "Merge PDF Files Free — Combine PDFs in Your Browser" },
  description:
    "Combine multiple PDFs into one file, in any order you drag them. Free, no sign-up, no upload — your files never leave your browser. Works on mobile.",
  alternates: { canonical: URL_PATH },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "PDF Merger",
  url: `https://tool-factory-lac.vercel.app${URL_PATH}`,
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Any",
  description:
    "Combine multiple PDF files into one document in your browser. Drag the files into the order you want, then download the merged PDF. Nothing is uploaded.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function PdfMergerPage() {
  const related = relatedTools("pdf-merger");

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="mb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Day 02
        </p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-foreground sm:text-5xl">
          Merge PDF files
        </h1>
        <p className="mt-4 max-w-xl text-base text-muted-foreground">
          Drop in a few PDFs, drag them into the order you want, and download the whole
          thing as one file. Nothing is uploaded anywhere.
        </p>
      </header>

      <Merger />

      <section className="mt-16 max-w-2xl space-y-4 text-sm leading-relaxed text-muted-foreground">
        <h2 className="font-display text-2xl text-foreground">How this PDF merger works</h2>
        <p>
          Three scanned receipts, a contract whose pages arrived one at a time, chapters of a
          report emailed separately — and the person on the other end wants a single
          attachment. This tool combines multiple PDFs into one file. Drop them in together or
          add them a few at a time, and each one shows up as a card with its name, page count
          and size.
        </p>
        <p>
          The list is the output order, top to bottom. Drag a card by its handle to move it,
          which works the same with a finger on a phone as with a mouse. If you would rather
          not drag, focus a card&rsquo;s handle and use the up and down arrow keys. Every card
          shows its position number, so the finished document holds no surprises. Tap
          Remove to drop a file you added by mistake.
        </p>
        <p>
          When the order looks right, press Merge PDFs and the combined file downloads as
          <code> merged.pdf</code>. The merge runs entirely inside your browser using pdf-lib —
          your documents are never uploaded, never sent to a server, and never stored anywhere.
          That matters more here than with most file tools, because the PDFs people need to
          combine tend to be the ones they would least like to hand to a stranger: contracts,
          payslips, medical letters, passport scans. It is free, there is no sign-up, and there
          is no cap on how many files you run through it.
        </p>
        <p>
          This tool combines whole documents, so it does not split, extract, delete or rotate
          individual pages. Password-protected PDFs can&rsquo;t be merged either — a locked file
          says so on its own card, and the rest of your files merge around it. Remove the
          password in whatever app made the file, then add it again.
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
