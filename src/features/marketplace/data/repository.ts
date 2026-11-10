import { z } from "zod";

import { resourceCategories } from "@/config/categories";
import { sampleListings } from "@/features/marketplace/data/sample-listings";
import type { Listing, NewListingInput } from "@/features/marketplace/types";

const listingsStorageKey = "bookloop.marketplace.listings.v1";
const savedStorageKey = "bookloop.marketplace.saved.v1";
export const marketplaceChangeEvent = "bookloop:marketplace-change";

const categorySlugs = resourceCategories.map((category) => category.slug);
const listingSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  categorySlug: z.enum(categorySlugs),
  kind: z.enum(["physical", "digital"]),
  pricePaise: z.number().int().nonnegative(),
  condition: z.enum(["new", "like-new", "good", "acceptable"]).optional(),
  format: z.string().optional(),
  sellerName: z.string().min(1),
  sellerType: z.enum(["Student", "Educator", "Creator"]),
  institution: z.string().optional(),
  createdAt: z.iso.datetime(),
  isSample: z.literal(false),
});
const storedListingsSchema = z.array(listingSchema);
const savedIdsSchema = z.array(z.string());

export type StoreSnapshot<T> =
  | { status: "loading" }
  | { status: "ready"; value: T }
  | { status: "error"; message: string };

const serverListingsSnapshot: StoreSnapshot<Listing[]> = { status: "loading" };
const serverSavedIdsSnapshot: StoreSnapshot<string[]> = { status: "loading" };
const listingsErrorSnapshot: StoreSnapshot<Listing[]> = {
  status: "error",
  message: "Saved demo listings could not be read. Check this browser's local storage settings.",
};
const savedIdsErrorSnapshot: StoreSnapshot<string[]> = {
  status: "error",
  message: "Saved-item data could not be read. Check this browser's local storage settings.",
};

let lastListingsRaw: string | null | undefined;
let listingsSnapshot: StoreSnapshot<Listing[]> | undefined;
let lastSavedIdsRaw: string | null | undefined;
let savedIdsSnapshot: StoreSnapshot<string[]> | undefined;

function readStoredListings(): Listing[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(listingsStorageKey);
  if (!raw) return [];

  const result = storedListingsSchema.safeParse(JSON.parse(raw));
  if (!result.success) {
    throw new Error("Saved demo listings could not be read. Clear this site's local storage and try again.");
  }
  return result.data;
}

export function getListingsSnapshot(): StoreSnapshot<Listing[]> {
  if (typeof window === "undefined") return serverListingsSnapshot;
  try {
    const raw = window.localStorage.getItem(listingsStorageKey);
    if (raw === lastListingsRaw && listingsSnapshot) return listingsSnapshot;

    lastListingsRaw = raw;
    if (!raw) {
      listingsSnapshot = {
        status: "ready",
        value: [...sampleListings].sort(
          (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
        ),
      };
      return listingsSnapshot;
    }

    const result = storedListingsSchema.safeParse(JSON.parse(raw));
    if (!result.success) {
      listingsSnapshot = listingsErrorSnapshot;
      return listingsSnapshot;
    }

    listingsSnapshot = {
      status: "ready",
      value: [...sampleListings, ...result.data].sort(
        (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
      ),
    };
    return listingsSnapshot;
  } catch {
    listingsSnapshot = listingsErrorSnapshot;
    return listingsSnapshot;
  }
}

function readSavedIds(): string[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(savedStorageKey);
  if (!raw) return [];

  const result = savedIdsSchema.safeParse(JSON.parse(raw));
  if (!result.success) {
    throw new Error("Saved-item data could not be read. Clear this site's local storage and try again.");
  }
  return result.data;
}

export function getSavedIdsSnapshot(): StoreSnapshot<string[]> {
  if (typeof window === "undefined") return serverSavedIdsSnapshot;
  try {
    const raw = window.localStorage.getItem(savedStorageKey);
    if (raw === lastSavedIdsRaw && savedIdsSnapshot) return savedIdsSnapshot;
    lastSavedIdsRaw = raw;

    if (!raw) {
      savedIdsSnapshot = { status: "ready", value: [] };
      return savedIdsSnapshot;
    }

    const result = savedIdsSchema.safeParse(JSON.parse(raw));
    savedIdsSnapshot = result.success
      ? { status: "ready", value: result.data }
      : savedIdsErrorSnapshot;
    return savedIdsSnapshot;
  } catch {
    savedIdsSnapshot = savedIdsErrorSnapshot;
    return savedIdsSnapshot;
  }
}

export function subscribeToMarketplace(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handleChange = () => {
    lastListingsRaw = undefined;
    listingsSnapshot = undefined;
    lastSavedIdsRaw = undefined;
    savedIdsSnapshot = undefined;
    onChange();
  };

  window.addEventListener(marketplaceChangeEvent, handleChange);
  window.addEventListener("storage", handleChange);
  return () => {
    window.removeEventListener(marketplaceChangeEvent, handleChange);
    window.removeEventListener("storage", handleChange);
  };
}

function notifyMarketplaceChanged() {
  lastListingsRaw = undefined;
  listingsSnapshot = undefined;
  lastSavedIdsRaw = undefined;
  savedIdsSnapshot = undefined;
  window.dispatchEvent(new CustomEvent(marketplaceChangeEvent));
}

export function getListings(): Listing[] {
  return [...sampleListings, ...readStoredListings()].sort(
    (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
  );
}

export function getListingBySlug(slug: string): Listing | undefined {
  return getListings().find((listing) => listing.slug === slug);
}

export function getSavedListingIds(): string[] {
  return readSavedIds();
}

export function toggleSavedListing(slug: string): string[] {
  if (typeof window === "undefined") {
    throw new Error("Saved listings are available in the browser only.");
  }
  const saved = new Set(readSavedIds());
  if (saved.has(slug)) saved.delete(slug);
  else saved.add(slug);

  const next = [...saved];
  window.localStorage.setItem(savedStorageKey, JSON.stringify(next));
  notifyMarketplaceChanged();
  return next;
}

export function createDemoListing(input: NewListingInput): Listing {
  if (typeof window === "undefined") {
    throw new Error("Demo listings can only be created in the browser.");
  }

  const id = crypto.randomUUID();
  const slugBase = input.title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const listing: Listing = {
    ...input,
    id,
    slug: `${slugBase || "resource"}-${id.slice(0, 8)}`,
    sellerName: "Your demo seller profile",
    sellerType: "Student",
    createdAt: new Date().toISOString(),
    isSample: false,
  };

  const next = [listing, ...readStoredListings()];
  window.localStorage.setItem(listingsStorageKey, JSON.stringify(next));
  notifyMarketplaceChanged();
  return listing;
}
