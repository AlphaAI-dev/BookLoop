import type { Metadata } from "next";
import { Search } from "lucide-react";

import { ComingSoon } from "@/components/shared/coming-soon";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = {
  title: "Browse",
};

export default function BrowsePage() {
  return (
    <div className="page-container pb-16">
      <PageHeader
        title="Browse resources"
        description="Search and filter textbooks, notes, equipment and exam-prep resources."
      />
      <ComingSoon
        icon={Search}
        title="Marketplace search is on its way"
        description="Listings, categories and filters arrive in the marketplace phase."
      />
    </div>
  );
}
