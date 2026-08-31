import type { Metadata } from "next";
import Link from "next/link";
import { relatedTools } from "@/lib/tools-registry";
import { Converter } from "./converter";

const URL_PATH = "/tools/image-format-converter";

export const metadata: Metadata = {
  // `absolute` skips the layout's "— Tool Factory" template, which would
  // otherwise push this past 60 characters.
  title: { absolute: "Image Format Converter — PNG, JPG, WebP, AVIF" },
  description:
    "Convert images between PNG, JPG, WebP, and AVIF right in your browser. Drop a file, pick a format, download in seconds. Free, nothing uploaded.",
  alternates: { canonical: URL_PATH },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Image Format Converter",
  url: `https://tool-factory-lac.vercel.app${URL_PATH}`,
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Any",
  description:
    "Convert PNG, JPG, WebP, and AVIF images to any of the other formats in your browser. Drop several files at once, pick a target format, set the quality, and download. Nothing is uploaded.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function ImageFormatConverterPage() {
  const related = relatedTools("image-format-converter");

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="mb-8">
        <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
          Day 05
        </p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-foreground sm:text-5xl">
          Convert images between PNG, JPG, WebP, and AVIF
        </h1>
        <p className="mt-4 max-w-xl text-base text-muted-foreground">
          Drop your images in, tap the format you need, download. It all happens on
          your device — nothing is uploaded, and there&rsquo;s no sign-up or watermark.
        </p>
      </header>

      <Converter />

      <section className="mt-16 max-w-2xl space-y-4 text-sm leading-relaxed text-muted-foreground">
        <h2 className="font-display text-2xl text-foreground">
          How this image format converter works
        </h2>
        <p>
          An upload form that only takes JPG. A site theme that wants WebP. A page
          speed report telling you to serve AVIF. The picture you already have is
          fine — it&rsquo;s just in the wrong wrapper. Drop it here, tap PNG, JPG, WebP
          or AVIF, and get the same picture in the format you were asked for.
        </p>
        <p>
          Drop as many images as you like at once; they all convert to the same target,
          and each row shows the new size and how much smaller or bigger it came out
          the moment it&rsquo;s ready. For JPG, WebP and AVIF there&rsquo;s a quality
          slider — around 80 is usually indistinguishable from the original at a
          fraction of the size, and dragging it re-converts every file so you can watch
          the numbers move before you commit. PNG is lossless, so the slider disappears
          for it. Download files one at a time, or take the lot in one tap.
        </p>
        <p>
          Your browser does the encoding itself, so the images never leave your phone or
          laptop, never touch a server, and aren&rsquo;t stored anywhere. That also means
          the formats on offer are the ones your browser can genuinely write: AVIF
          encoding works in Chrome and Edge today, while Safari and Firefox can open
          AVIF but not create it. Rather than quietly handing you a PNG named
          &ldquo;.avif&rdquo;, this tool checks on load and greys out anything your
          browser can&rsquo;t actually produce.
        </p>
        <p>
          It converts formats and nothing else — no cropping, resizing or rotating — and
          it reads ordinary web images only: PNG, JPG, WebP, AVIF, and the first frame of
          a GIF. RAW, HEIC and SVG files aren&rsquo;t supported. If you need the result
          smaller still, the{" "}
          <Link
            href="/tools/file-size-reducer"
            className="text-[#D6246E] underline-offset-4 hover:underline"
          >
            File Size Reducer
          </Link>{" "}
          will shrink it, and the{" "}
          <Link
            href="/tools/background-remover"
            className="text-[#D6246E] underline-offset-4 hover:underline"
          >
            Background Remover
          </Link>{" "}
          will cut the subject out first.
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
