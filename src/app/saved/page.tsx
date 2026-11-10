import type { Metadata } from "next";

import { SavedMarketplace } from "@/features/marketplace/components/saved-marketplace";

export const metadata: Metadata = { title: "Saved resources" };

export default function SavedPage() {
  return <SavedMarketplace />;
}
