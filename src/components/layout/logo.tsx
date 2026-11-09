import Link from "next/link";
import { RefreshCw } from "lucide-react";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-2 rounded-md font-semibold tracking-tight outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="inline-flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"
      >
        <RefreshCw className="size-4" strokeWidth={2.5} />
      </span>
      <span className="text-lg">{siteConfig.name}</span>
    </Link>
  );
}
