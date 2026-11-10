"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState, useSyncExternalStore } from "react";

import { resourceCategories } from "@/config/categories";
import { ListingCard } from "@/features/marketplace/components/listing-card";
import {
  getListingsSnapshot,
  getServerListingsSnapshot,
  subscribeToMarketplace,
} from "@/features/marketplace/data/repository";
import type { Listing } from "@/features/marketplace/types";

const emptyListings: Listing[] = [];
export function BrowseMarketplace() {
  const listingsSnapshot = useSyncExternalStore(
    subscribeToMarketplace,
    getListingsSnapshot,
    getServerListingsSnapshot,
  );
  const [query, setQuery] = useState("");
  const [categorySlug, setCategorySlug] = useState("all");
  const [kind, setKind] = useState("all");

  const listings = listingsSnapshot.status === "ready" ? listingsSnapshot.value : emptyListings;

  const filteredListings = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return listings.filter((listing) => {
      const matchesCategory = categorySlug === "all" || listing.categorySlug === categorySlug;
      const matchesKind = kind === "all" || listing.kind === kind;
      const categoryName = resourceCategories.find((item) => item.slug === listing.categorySlug)?.name ?? "";
      const searchable = [listing.title, listing.description, listing.sellerName, listing.institution, categoryName]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase();
      return matchesCategory && matchesKind && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [categorySlug, kind, listings, query]);

  const hasFilters = Boolean(query || categorySlug !== "all" || kind !== "all");

  function clearFilters() {
    setQuery("");
    setCategorySlug("all");
    setKind("all");
  }

  return (
    <div className="page-container pb-20">
      <section className="relative isolate mt-8 overflow-hidden rounded-[1.75rem] bg-primary px-6 py-9 text-primary-foreground sm:px-10 sm:py-12 lg:px-14">
        <div aria-hidden="true" className="absolute -right-20 -top-28 -z-10 size-80 rounded-full border-[36px] border-primary-foreground/10" />
        <div aria-hidden="true" className="absolute -bottom-24 right-[24%] -z-10 size-48 rotate-12 rounded-[3rem] border border-primary-foreground/15" />
        <p className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-primary-foreground/70">
          <BookOpen aria-hidden="true" className="size-4" /> A better second semester starts here
        </p>
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-2xl">
            <h1 className="text-4xl leading-[1.05] font-semibold tracking-[-0.04em] sm:text-5xl">
              Good resources<br className="hidden sm:block" /> keep moving.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-primary-foreground/75">
              Find the book, notes or study tools that helped someone else get through the same course.
            </p>
          </div>
          <Link href="/sell" className="inline-flex w-fit items-center gap-2 rounded-full bg-highlight px-5 py-3 text-sm font-bold text-highlight-foreground transition-transform hover:translate-x-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight">
            Pass something on <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </section>

      <section className="mt-9" aria-label="Search and filter listings">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">The resource shelf</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Browse what students are sharing</h2>
            <p className="mt-1 text-sm text-muted-foreground">Listings marked Sample are fictional. Demo listings you create stay in this browser.</p>
          </div>
          <div className="grid w-full gap-3 sm:grid-cols-[minmax(220px,1fr)_190px_150px] lg:max-w-3xl">
            <label className="relative block">
              <span className="sr-only">Search resources</span>
              <Search aria-hidden="true" className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search books, subjects, campus…"
                className="h-12 w-full rounded-xl border border-input bg-card pl-10 pr-4 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
            <label className="relative">
              <span className="sr-only">Filter by category</span>
              <SlidersHorizontal aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <select value={categorySlug} onChange={(event) => setCategorySlug(event.target.value)} className="h-12 w-full appearance-none rounded-xl border border-input bg-card pl-10 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <option value="all">All categories</option>
                {resourceCategories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}
              </select>
            </label>
            <label>
              <span className="sr-only">Filter by resource kind</span>
              <select value={kind} onChange={(event) => setKind(event.target.value)} className="h-12 w-full rounded-xl border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <option value="all">All formats</option>
                <option value="physical">Physical</option>
                <option value="digital">Digital</option>
              </select>
            </label>
          </div>
        </div>

        <div className="mt-6 flex min-h-8 flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-4">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {listingsSnapshot.status === "ready" ? <><strong className="text-foreground">{filteredListings.length}</strong> resources to explore</> : "Preparing the resource shelf…"}
          </p>
          {hasFilters && <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            Clear filters <X aria-hidden="true" className="size-4" />
          </button>}
        </div>

        {listingsSnapshot.status === "loading" && (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-label="Loading resources">
            {Array.from({ length: 6 }, (_, index) => <div key={index} className="h-[345px] animate-pulse rounded-2xl border border-border bg-muted/60" />)}
          </div>
        )}
        {listingsSnapshot.status === "error" && (
          <div className="mt-8 rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
            <h3 className="font-semibold">We couldn’t load the resource shelf</h3>
            <p className="mt-2 text-sm text-muted-foreground">{listingsSnapshot.message}</p>
            <button type="button" onClick={() => window.location.reload()} className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Try again</button>
          </div>
        )}
        {listingsSnapshot.status === "ready" && filteredListings.length > 0 && (
          <div className="mt-6 grid items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredListings.map((listing) => <ListingCard key={listing.slug} listing={listing} />)}
          </div>
        )}
        {listingsSnapshot.status === "ready" && filteredListings.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-primary/30 bg-accent/40 px-6 py-14 text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-background text-primary"><Search aria-hidden="true" /></div>
            <h3 className="mt-4 text-lg font-semibold">Nothing on this shelf yet</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">Try a broader search or another category. There are plenty of useful resources waiting to find their next student.</p>
            <button type="button" onClick={clearFilters} className="mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Reset search <X aria-hidden="true" className="size-4" />
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
