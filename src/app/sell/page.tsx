import type { Metadata } from "next";
import { Upload } from "lucide-react";

import { ComingSoon } from "@/components/shared/coming-soon";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = {
  title: "Sell",
};

export default function SellPage() {
  return (
    <div className="page-container pb-16">
      <PageHeader
        title="Sell on BookLoop"
        description="List a physical item or publish an original digital resource."
      />
      <ComingSoon
        icon={Upload}
        title="Listing creation is on its way"
        description="Sign-in and the physical and digital listing flows arrive in later phases."
      />
    </div>
  );
}
