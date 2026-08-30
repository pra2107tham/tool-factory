import type { Metadata } from "next";
import Link from "next/link";
import { relatedTools } from "@/lib/tools-registry";
import { Remover } from "./remover";

const URL_PATH = "/tools/background-remover";

export const metadata: Metadata = {
  // `absolute` skips the layout's "— Tool Factory" template, which would
  // otherwise push this past 60 characters.
  title: { absolute: "Background Remover — Free, Private, No Upload" },
  description:
    "Remove the background from any photo in one click. Runs entirely in your browser, so your images never upload. Free, no sign-up, download a PNG.",
  alternates: { canonical: URL_PATH },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Background Remover",
  url: `https://tool-factory-lac.vercel.app${URL_PATH}`,
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Any",
  description:
    "Remove the background from a photo in your browser. Drop an image and the cutout appears automatically, then download it as a transparent PNG or on a solid colour. The photo is never uploaded.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function BackgroundRemoverPage() {
  const related = relatedTools("background-remover");

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="mb-8">
        <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
          Day 04
        </p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-foreground sm:text-5xl">
          Remove the background from a photo
        </h1>
        <p className="mt-4 max-w-xl text-base text-muted-foreground">
          Drop a photo in and the cutout appears on its own. Download it as a transparent PNG,
          or on any solid colour you pick. The photo never leaves your device.
        </p>
      </header>

      <Remover />

      <section className="mt-16 max-w-2xl space-y-4 text-sm leading-relaxed text-muted-foreground">
        <h2 className="font-display text-2xl text-foreground">
          How this background remover works
        </h2>
        <p>
          A product shot that needs to sit on a white marketplace listing. A photo of the dog
          for a birthday card. A headshot that has somebody else&rsquo;s kitchen behind it. This
          tool takes one photo and gives back the subject on its own, cut out from whatever was
          behind it.
        </p>
        <p>
          There is no start button. Drop an image in, or tap to pick one from your camera roll,
          and the cutout starts immediately. The first photo takes a moment because a roughly
          40MB segmentation model has to download — you&rsquo;ll see the real percentage as it
          arrives, not a spinner that tells you nothing. Your browser caches that model, so
          every photo after the first is quick, and it keeps working with the connection off.
        </p>
        <p>
          The result appears on a checkerboard so you can see exactly where the transparency
          falls. Drag the handle across to wipe the original photo back in and judge the edges
          for yourself — hair, fur and thin straps are where cutouts usually go wrong, and it is
          better to see that here than after you have posted the listing. When the edge looks
          right, download it as a transparent PNG, or tap a colour first: white for marketplace
          and passport-style photos, a soft blue or grey when the subject needs to stand off the
          page.
        </p>
        <p>
          Everything happens inside your browser, using WebAssembly. The photo is never
          uploaded, never sits on a server, and is never stored — which matters when the picture
          is of your child, your ID, or an unreleased product. It is free, there is no sign-up,
          and there is no watermark or resolution cap. This tool does one job: it removes
          backgrounds, one photo at a time. It doesn&rsquo;t crop, resize, retouch, or let you
          paint the mask by hand. If you need the finished PNG to be smaller, the{" "}
          <Link
            href="/tools/file-size-reducer"
            className="text-[#5B3DF5] underline-offset-4 hover:underline"
          >
            File Size Reducer
          </Link>{" "}
          will shrink it afterwards.
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
