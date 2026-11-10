import type { ListingKind, resourceCategories } from "@/config/categories";

export type MarketplaceCategory = (typeof resourceCategories)[number]["slug"];

export type PhysicalCondition = "new" | "like-new" | "good" | "acceptable";

export type Listing = {
  id: string;
  slug: string;
  title: string;
  description: string;
  categorySlug: MarketplaceCategory;
  kind: ListingKind;
  pricePaise: number;
  condition?: PhysicalCondition;
  format?: string;
  sellerName: string;
  sellerType: "Student" | "Educator" | "Creator";
  institution?: string;
  createdAt: string;
  isSample: boolean;
};

export type NewListingInput = Pick<
  Listing,
  "title" | "description" | "categorySlug" | "kind" | "pricePaise" | "condition" | "format"
>;
