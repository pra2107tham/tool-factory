import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
        <Link href="/" className="font-display text-xl font-medium text-foreground">
          Tool Factory
        </Link>
        <a
          href="https://github.com/pra2107tham/tool-factory"
          className="font-mono text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-primary"
        >
          Source
        </a>
      </div>
    </header>
  );
}
