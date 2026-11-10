"use client";

import Link from "next/link";
import { Bookmark, ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";

import { ListingCard } from "@/features/marketplace/components/listing-card";
import {
  getListings,
  getSavedListingIds,
  marketplaceChangeEvent,
} from "@/features/marketplace/data/repository";
import type { Listing } from "@/features/marketplace/types";

type State = "loading" | "ready" | "error";

export function SavedMarketplace() {
  const [savedListings, setSavedListings] = useState<Listing[]>([]);
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    function refresh() {
      try {
        const ids = new Set(getSavedListingIds());
        setSavedListings(getListings().filter((listing) => ids.has(listing.slug)));
        setState("ready");
      } catch {
        setState("error");
      }
    }
    refresh();
    window.addEventListener(marketplaceChangeEvent, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(marketplaceChangeEvent, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return (
    <main className="page-container min-h-[60vh] pb-20">
      <Link href="/browse" className="mt-8 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <ChevronLeft aria-hidden="true" className="size-4" /> Browse resources
      </Link>
      <header className="mt-7 max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Your shortlist</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em]">Saved resources</h1>
        <p className="mt-3 leading-relaxed text-muted-foreground">Keep the useful finds close while you decide what fits your next class or project.</p>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">Saved items live only in this browser on this device. They are not synced to an account and may be cleared when browser data is removed.</p>
      </header>
      {state === "loading" && <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-label="Loading saved resources">{[0, 1, 2].map((item) => <div key={item} className="h-[340px] animate-pulse rounded-2xl border border-border bg-muted/60" />)}</div>}
      {state === "error" && <div role="alert" className="mt-8 rounded-2xl border border-destructive/30 bg-destructive/5 p-6"><h2 className="font-semibold">Saved items couldn’t be read</h2><p className="mt-1 text-sm text-muted-foreground">Check local storage settings in this browser, then reload this page.</p></div>}
      {state === "ready" && savedListings.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-primary/30 bg-accent/40 px-6 py-14 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-background text-primary"><Bookmark aria-hidden="true" /></div>
          <h2 className="mt-4 text-lg font-semibold">Your shortlist is still open</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">Save a resource from its card or detail page and it will be waiting here in this browser.</p>
          <Link href="/browse" className="mt-5 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Explore resources</Link>
        </div>
      )}
      {state === "ready" && savedListings.length > 0 && (
        <>
          <p className="mt-8 mb-4 text-sm text-muted-foreground">{savedListings.length} saved {savedListings.length === 1 ? "resource" : "resources"}</p>
          <div className="grid items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3">{savedListings.map((listing) => <ListingCard key={listing.slug} listing={listing} />)}</div>
        </>
      )}
    </main>
  );
}
