import type { Metadata } from "next";
import Link from "next/link";
import { Compressor } from "./compressor";

const URL_PATH = "/tools/file-size-reducer";

export const metadata: Metadata = {
  // `absolute` skips the layout's "— Tool Factory" template, which would
  // otherwise push this past 60 characters.
  title: { absolute: "Reduce Image File Size — Free Online Compressor" },
  description:
    "Drop an image and get three smaller versions instantly. Free, no signup, and private — compression happens in your browser, nothing is uploaded.",
  alternates: { canonical: URL_PATH },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "File Size Reducer",
  url: `https://tool-factory-lac.vercel.app${URL_PATH}`,
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Any",
  description:
    "Reduce an image's file size in your browser. Drop a JPEG, PNG or WebP and get three smaller versions to download.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function FileSizeReducerPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="mb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Day 01
        </p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-foreground sm:text-5xl">
          Reduce image file size
        </h1>
        <p className="mt-4 max-w-xl text-base text-muted-foreground">
          Drop a photo and get three smaller versions, side by side, in a couple of seconds.
          Pick the one that fits and download it.
        </p>
      </header>

      <Compressor />

      <section className="mt-16 max-w-2xl space-y-4 text-sm leading-relaxed text-muted-foreground">
        <h2 className="font-display text-2xl text-foreground">
          How this compressor works
        </h2>
        <p>
          Upload forms are fussy. A job application caps attachments at 2MB, a school portal
          wants under 1MB, and the photo you just took is 6MB. This tool takes that photo and
          makes three smaller copies of it at once — Light, Balanced and Smallest — so you can
          look at the file sizes, pick the first one that clears the limit, and get on with it.
          There is no quality slider to fiddle with and nothing to configure. The three
          versions are the whole tool.
        </p>
        <p>
          Everything happens inside your browser. Your image is never uploaded, never sent to a
          server, and never stored anywhere — the compression runs on your own device using the
          browser&rsquo;s built-in canvas, which is also why the results appear almost
          instantly even on a phone. It is free, there is no signup, and there is no limit on
          how many images you run through it.
        </p>
        <p>
          Light keeps the original dimensions and eases off the quality slightly. Balanced
          scales the long edge down to 2000 pixels, which is still far more detail than any
          web form or email needs. Smallest goes to 1280 pixels for when a limit is really
          tight. Each card shows the resulting file size and how much smaller it is than the
          original, so you are never guessing.
        </p>
        <p>
          The tool reads JPEG, PNG and WebP. Everything is saved as a JPEG (or WebP, if that
          was your original), because re-saving a PNG usually makes it <em>bigger</em>, not
          smaller. If your image has a transparent background, that transparency becomes white.
          iPhone photos in HEIC format can&rsquo;t be opened by browsers at all — switch your
          camera to Most Compatible, or screenshot the photo first.
        </p>
      </section>

      <nav className="mt-12 border-t border-border pt-6">
        <Link href="/" className="text-sm text-primary underline-offset-4 hover:underline">
          ← All tools
        </Link>
      </nav>
    </div>
  );
}
