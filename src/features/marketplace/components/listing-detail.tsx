"use client";

import Link from "next/link";
import { ArrowLeft, Bookmark, BookmarkCheck, Check, FileText, Package } from "lucide-react";
import { useState, useSyncExternalStore } from "react";

import { resourceCategories } from "@/config/categories";
import {
  getListingsSnapshot,
  getSavedIdsSnapshot,
  subscribeToMarketplace,
  toggleSavedListing,
} from "@/features/marketplace/data/repository";
import type { Listing } from "@/features/marketplace/types";

function formatPrice(pricePaise: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(pricePaise / 100);
}

const conditionLabels: Record<NonNullable<Listing["condition"]>, string> = {
  new: "New",
  "like-new": "Like new",
  good: "Good",
  acceptable: "Acceptable",
};

export function ListingDetail({ slug }: { slug: string }) {
  const [message, setMessage] = useState("");
  const listingsSnapshot = useSyncExternalStore(
    subscribeToMarketplace,
    getListingsSnapshot,
    getListingsSnapshot,
  );
  const savedSnapshot = useSyncExternalStore(
    subscribeToMarketplace,
    getSavedIdsSnapshot,
    getSavedIdsSnapshot,
  );
  const listing =
    listingsSnapshot.status === "ready"
      ? listingsSnapshot.value.find((item) => item.slug === slug)
      : undefined;
  const isSaved =
    savedSnapshot.status === "ready" && savedSnapshot.value.includes(slug);

  function toggleSave() {
    try {
      toggleSavedListing(slug);
      setMessage(isSaved ? "Removed from your saved resources." : "Saved in this browser.");
    } catch {
      setMessage("Could not update saved resources. Check this browser's local storage settings.");
    }
  }

  if (listingsSnapshot.status === "loading" || savedSnapshot.status === "loading") {
    return <main className="page-container min-h-[60vh] pb-16"><div className="mt-8 h-6 w-36 animate-pulse rounded bg-muted" /><div className="mt-8 h-80 animate-pulse rounded-3xl bg-muted" /></main>;
  }
  if (listingsSnapshot.status === "error" || savedSnapshot.status === "error") {
    return <main className="page-container py-16"><div role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8"><h1 className="text-xl font-semibold">This resource couldn’t be loaded</h1><p className="mt-2 text-sm text-muted-foreground">{listingsSnapshot.status === "error" ? listingsSnapshot.message : savedSnapshot.status === "error" ? savedSnapshot.message : ""}</p><button type="button" onClick={() => window.location.reload()} className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Try again</button></div></main>;
  }
  if (!listing) {
    return <main className="page-container py-16"><div className="max-w-xl rounded-3xl border border-border bg-card p-8"><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">No match found</p><h1 className="mt-3 text-3xl font-semibold tracking-tight">This resource has moved on</h1><p className="mt-3 leading-relaxed text-muted-foreground">The listing may no longer be available in this browser’s demo shelf.</p><Link href="/browse" className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"><ArrowLeft aria-hidden="true" className="size-4" /> Back to browse</Link></div></main>;
  }

  const category = resourceCategories.find((item) => item.slug === listing.categorySlug);
  return (
    <main className="page-container pb-20">
      <Link href="/browse" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><ArrowLeft aria-hidden="true" className="size-4" /> All resources</Link>
      <article className="mt-6 grid overflow-hidden rounded-[1.75rem] border border-border bg-card lg:grid-cols-[0.95fr_1.05fr]">
        <div className="relative flex min-h-64 items-end overflow-hidden bg-[linear-gradient(145deg,oklch(0.94_0.035_250),oklch(0.88_0.075_78))] p-7 sm:min-h-96 sm:p-10">
          <div aria-hidden="true" className="absolute -right-14 -top-16 size-64 rounded-full border-[32px] border-primary/10" />
          <div aria-hidden="true" className="absolute bottom-10 left-1/4 h-36 w-36 rotate-12 rounded-[2rem] border border-primary/20" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-background/80 px-3 py-1.5 text-xs font-semibold text-primary backdrop-blur">{listing.kind === "digital" ? <FileText aria-hidden="true" className="size-4" /> : <Package aria-hidden="true" className="size-4" />}{listing.kind === "digital" ? "Digital resource" : "Physical item"}</span>
            {listing.isSample && <span className="ml-2 inline-block rounded-full bg-highlight px-3 py-1.5 text-xs font-bold text-highlight-foreground">Sample listing</span>}
            <p className="mt-6 max-w-xs text-sm font-medium leading-relaxed text-foreground/70">A resource with another chapter ahead of it.</p>
          </div>
        </div>
        <div className="p-6 sm:p-9 lg:p-11">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{category?.name ?? "Academic resource"}</p>
          <h1 className="mt-3 text-3xl leading-tight font-semibold tracking-[-0.035em] sm:text-4xl">{listing.title}</h1>
          <p className="mt-5 text-3xl font-bold tracking-tight text-primary">{formatPrice(listing.pricePaise)}</p>
          <p className="mt-5 leading-7 text-muted-foreground">{listing.description}</p>
          <div className="mt-7 grid grid-cols-2 gap-3 border-y border-border py-5">
            <div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Format</p><p className="mt-1.5 text-sm font-semibold">{listing.format ?? (listing.kind === "physical" ? "In-person item" : "Digital file")}</p></div>
            <div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Condition</p><p className="mt-1.5 text-sm font-semibold">{listing.condition ? conditionLabels[listing.condition] : "Digital resource"}</p></div>
          </div>
          <div className="mt-6 flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-sm font-bold text-primary" aria-hidden="true">{listing.sellerName.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span>
            <div><p className="font-semibold">{listing.sellerName}</p><p className="mt-0.5 text-xs text-muted-foreground">{listing.sellerType}{listing.institution ? ` · ${listing.institution}` : ""}</p></div>
          </div>
          <button type="button" onClick={toggleSave} aria-pressed={isSaved} className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-primary/25 bg-accent/50 px-4 text-sm font-bold text-primary transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {isSaved ? <BookmarkCheck aria-hidden="true" className="size-4" /> : <Bookmark aria-hidden="true" className="size-4" />}
            {isSaved ? "Saved to your shortlist" : "Save this resource"}
          </button>
          <p className="mt-3 text-center text-xs leading-relaxed text-muted-foreground">This is a browsing demo. Saving is stored only in this browser; no purchase or contact flow is available.</p>
          {message && <p role="status" className="mt-3 flex items-center justify-center gap-1.5 text-xs font-medium text-success"><Check aria-hidden="true" className="size-3.5" />{message}</p>}
        </div>
      </article>
    </main>
  );
}
