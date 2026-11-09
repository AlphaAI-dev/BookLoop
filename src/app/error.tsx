"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    // Replace with an error-reporting service once one is approved.
    console.error(error);
  }, [error]);

  return (
    <div
      role="alert"
      className="page-container flex flex-1 flex-col items-center justify-center gap-4 py-20 text-center"
    >
      <TriangleAlert className="size-10 text-destructive" aria-hidden="true" />
      <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="max-w-md text-muted-foreground">
        An unexpected error occurred. Please try again.
      </p>
      <Button onClick={() => retry()}>Try again</Button>
    </div>
  );
}
