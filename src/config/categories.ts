/**
 * Resource categories BookLoop is validating.
 *
 * TEMPORARY: display-only copy for the Phase 1 shell. The canonical list moves
 * to the `categories` table in BL-002 (Supabase foundation); do not build
 * business logic on these constants.
 */

export type ListingKind = "physical" | "digital";

export type CategoryIcon = "textbook" | "notes" | "equipment" | "exam" | "digital";

export type ResourceCategory = {
  slug: string;
  name: string;
  description: string;
  icon: CategoryIcon;
  /** Listing types a seller may use for this category. */
  listingKinds: readonly ListingKind[];
};

export const resourceCategories = [
  {
    slug: "textbooks",
    name: "Used textbooks",
    description: "Course books passed on by students who finished the module.",
    icon: "textbook",
    listingKinds: ["physical"],
  },
  {
    slug: "notes",
    name: "Notes & study guides",
    description: "Original notes and summaries written by the students who took the course.",
    icon: "notes",
    listingKinds: ["physical", "digital"],
  },
  {
    slug: "equipment",
    name: "Academic equipment",
    description: "Calculators, lab kits, drawing instruments and other course essentials.",
    icon: "equipment",
    listingKinds: ["physical"],
  },
  {
    slug: "exam-prep",
    name: "Exam preparation",
    description: "Practice sets, revision packs and worked solutions for upcoming exams.",
    icon: "exam",
    listingKinds: ["physical", "digital"],
  },
  {
    slug: "digital-resources",
    name: "Digital resources",
    description: "Original educational files from educators and independent creators.",
    icon: "digital",
    listingKinds: ["digital"],
  },
] as const satisfies readonly ResourceCategory[];
