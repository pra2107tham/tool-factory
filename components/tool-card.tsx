import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Tool } from "@/lib/tools-registry";

export function ToolCard({ tool }: { tool: Tool }) {
  return (
    <Link href={`/tools/${tool.slug}`} className="group block">
      <Card className="h-full border-border transition-colors group-hover:border-primary">
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
          <CardTitle className="font-display text-lg font-medium text-foreground">
            {tool.title}
          </CardTitle>
          <Badge
            variant="outline"
            className="shrink-0 border-accent/40 bg-accent/10 font-mono text-[10px] tracking-wider text-accent-foreground"
          >
            Day {String(tool.day).padStart(2, "0")}
          </Badge>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{tool.oneLiner}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
