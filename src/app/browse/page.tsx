import type { Metadata } from "next";

import { BrowseMarketplace } from "@/features/marketplace/components/browse-marketplace";

export const metadata: Metadata = {
  title: "Browse",
};

export default function BrowsePage() {
  return <BrowseMarketplace />;
}
