"use client";

import Link from "next/link";
import { Bookmark, BookmarkCheck, FileText, Package } from "lucide-react";
import { useState, useSyncExternalStore } from "react";

import { resourceCategories } from "@/config/categories";
import {
  getSavedIdsSnapshot,
  subscribeToMarketplace,
  toggleSavedListing,
} from "@/features/marketplace/data/repository";
import type { Listing } from "@/features/marketplace/types";

function formatPrice(pricePaise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(pricePaise / 100);
}

function getConditionLabel(condition: Listing["condition"]) {
  if (!condition) return undefined;
  return {
    new: "New",
    "like-new": "Like new",
    good: "Good",
    acceptable: "Acceptable",
  }[condition];
}

export function ListingCard({ listing }: { listing: Listing }) {
  const [saveError, setSaveError] = useState("");
  const savedSnapshot = useSyncExternalStore(
    subscribeToMarketplace,
    getSavedIdsSnapshot,
    getSavedIdsSnapshot,
  );
  const isSaved =
    savedSnapshot.status === "ready" && savedSnapshot.value.includes(listing.slug);
  const savedError =
    savedSnapshot.status === "error" ? savedSnapshot.message : "";
  const category = resourceCategories.find((item) => item.slug === listing.categorySlug);

  function handleSave() {
    try {
      toggleSavedListing(listing.slug);
      setSaveError("");
    } catch {
      setSaveError("Could not update saved items. Check this browser's local storage settings.");
    }
  }

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-card transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5">
      <div className="relative flex min-h-36 items-end justify-between overflow-hidden bg-[linear-gradient(135deg,oklch(0.95_0.025_250),oklch(0.91_0.045_80))] p-5">
        <div aria-hidden="true" className="absolute -right-5 -top-8 h-32 w-32 rounded-full border-[20px] border-primary/10" />
        <div aria-hidden="true" className="absolute bottom-[-2.6rem] left-1/3 h-24 w-24 rotate-12 rounded-3xl border border-primary/15" />
        <span className="relative rounded-full border border-primary/10 bg-background/80 px-3 py-1 text-xs font-semibold tracking-wide text-primary backdrop-blur">
          {category?.name ?? "Academic resource"}
        </span>
        <span className="relative grid size-11 place-items-center rounded-xl bg-background/85 text-primary shadow-sm">
          {listing.kind === "digital" ? <FileText aria-hidden="true" /> : <Package aria-hidden="true" />}
        </span>
        <button
          type="button"
          onClick={handleSave}
          aria-label={isSaved ? `Remove ${listing.title} from saved items` : `Save ${listing.title}`}
          aria-pressed={isSaved}
          className="absolute right-3 top-3 grid size-10 place-items-center rounded-full border border-border/70 bg-background/90 text-primary shadow-sm transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {isSaved ? <BookmarkCheck aria-hidden="true" className="size-5" /> : <Bookmark aria-hidden="true" className="size-5" />}
        </button>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
          <span>{listing.kind === "digital" ? "Digital resource" : "Physical item"}</span>
          {listing.condition && <span className="before:mr-2 before:text-border before:content-['/']">{getConditionLabel(listing.condition)}</span>}
        </div>
        <Link
          href={`/browse/${listing.slug}`}
          className="text-lg leading-snug font-semibold tracking-tight text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {listing.title}
        </Link>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{listing.description}</p>
        <div className="mt-auto flex items-end justify-between gap-3 pt-6">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">Shared by {listing.sellerName}</p>
            {listing.institution && <p className="mt-1 truncate text-xs text-muted-foreground/80">{listing.institution}</p>}
          </div>
          <p className="shrink-0 text-lg font-bold tracking-tight text-primary">{formatPrice(listing.pricePaise)}</p>
        </div>
        {listing.isSample && (
          <span className="mt-4 w-fit rounded-md bg-highlight/30 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-highlight-foreground">
            Sample listing
          </span>
        )}
        {(saveError || savedError) && (
          <p role="status" className="mt-2 text-xs text-destructive">
            {saveError || savedError}
          </p>
        )}
      </div>
    </article>
  );
}
