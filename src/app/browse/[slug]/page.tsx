import { Suspense } from "react";
import type { Metadata } from "next";

import { ListingDetail } from "@/features/marketplace/components/listing-detail";

export const metadata: Metadata = { title: "Resource details" };

export default function ListingPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<main className="page-container min-h-[60vh] py-10"><div className="h-80 animate-pulse rounded-3xl bg-muted" /></main>}>
      {params.then(({ slug }) => <ListingDetail slug={slug} />)}
    </Suspense>
  );
}
