import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type ComingSoonProps = {
  icon: LucideIcon;
  title: string;
  description: string;
};

/** Empty state for routes whose feature lands in a later phase. */
export function ComingSoon({ icon: Icon, title, description }: ComingSoonProps) {
  return (
    <Card className="items-center border-dashed py-12 text-center shadow-none">
      <CardContent className="flex max-w-md flex-col items-center gap-4">
        <span className="inline-flex size-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          <Icon className="size-6" aria-hidden="true" />
        </span>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/">Back to home</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
