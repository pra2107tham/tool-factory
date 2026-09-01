import type { Metadata } from "next";
import Link from "next/link";
import QRCode from "qrcode";
import { relatedTools } from "@/lib/tools-registry";
import { Generator } from "./generator";
import { COLOR, EXAMPLE, QUIET_ZONE } from "./qr";

const URL_PATH = "/tools/qr-code-generator";

export const metadata: Metadata = {
  // `absolute` skips the layout's "— Tool Factory" template, which would
  // otherwise push this past 60 characters.
  title: { absolute: "Free QR Code Generator — PNG & SVG, No Sign-Up" },
  description:
    "Turn any link or text into a QR code instantly. Download as PNG or SVG, free and unlimited. Runs in your browser — nothing is uploaded or tracked.",
  alternates: { canonical: URL_PATH },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "QR Code Generator",
  url: `https://tool-factory-lac.vercel.app${URL_PATH}`,
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Any",
  description:
    "Generate a QR code from any URL or text in your browser. Live preview as you type, PNG downloads at 512, 1024 or 2048 pixels, SVG for print, and L/M/Q/H error correction. Nothing is uploaded and the codes never expire.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default async function QrCodeGeneratorPage() {
  const related = relatedTools("qr-code-generator");
  // The example code is built once, at build time, so it's in the first paint —
  // every code after this one is made in the browser.
  const initialSvg = await QRCode.toString(EXAMPLE, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: QUIET_ZONE,
    color: COLOR,
  });

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="mb-8">
        <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
          Day 06
        </p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-foreground sm:text-5xl">
          QR Code Generator
        </h1>
        <p className="mt-4 max-w-xl text-base text-muted-foreground">
          Type a link, get a QR code. Download it as a PNG for the poster or an SVG
          for the printer. No account, no watermark, and no link that stops working
          in six months.
        </p>
      </header>

      <Generator initialSvg={initialSvg} />

      <section className="mt-16 max-w-2xl space-y-4 text-sm leading-relaxed text-muted-foreground">
        <h2 className="font-display text-2xl text-foreground">
          How this QR code generator works
        </h2>
        <p>
          Paste a URL, a wifi password, a phone number, a few lines of text — anything
          you can type. The code redraws on every keystroke, so you can see it working
          before you decide anything. When it looks right, take the PNG at 512, 1024 or
          2048 pixels square, or take the SVG, which is vector and stays sharp at any
          size you print it. Both are made on your device the moment you tap the button.
        </p>
        <p>
          Every code here is <strong className="text-foreground">static</strong>: the
          link is written into the pattern of black squares itself. That&rsquo;s why
          these never expire. A dynamic QR code — the kind most generators quietly hand
          you — points at a short link on someone else&rsquo;s server, which lets them
          count your scans, and lets your poster die the day that server does. Nothing
          here can be switched off later, because there&rsquo;s nothing in the middle.
          The tradeoff is that the destination is fixed, so change the link and you make
          a new code.
        </p>
        <p>
          Error correction is the L/M/Q/H setting. QR codes carry spare copies of their
          own data, so a scanner can rebuild the message from a code that&rsquo;s been
          scratched, folded, rained on or partly covered — L recovers about 7%, H about
          30%. Higher levels mean a denser grid of smaller squares, so use M for a screen
          or a poster and H for stickers, table tents, and anything printed small.
        </p>
        <p>
          Nothing is uploaded. The encoding happens in your browser, so the link you type
          never reaches a server here and no scan is ever counted. Codes are plain black
          on white, which is what scanners are built for. If you need the finished PNG in
          another format, the{" "}
          <Link
            href="/tools/image-format-converter"
            className="text-[#FF5A1F] underline-offset-4 hover:underline"
          >
            Image Format Converter
          </Link>{" "}
          will change it, and the{" "}
          <Link
            href="/tools/file-size-reducer"
            className="text-[#FF5A1F] underline-offset-4 hover:underline"
          >
            File Size Reducer
          </Link>{" "}
          will shrink a 2048px code for the web.
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
