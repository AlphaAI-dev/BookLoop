import type { Metadata } from "next";

import { ListingForm } from "@/features/marketplace/components/listing-form";

export const metadata: Metadata = {
  title: "Sell",
};

export default function SellPage() {
  return <ListingForm />;
}
