import { z } from "zod";

import { resourceCategories } from "@/config/categories";

const categorySlugs = resourceCategories.map((category) => category.slug);

export const listingSubmissionSchema = z
  .object({
    title: z.string().trim().min(5, "Use at least 5 characters.").max(100, "Keep the title under 100 characters."),
    description: z
      .string()
      .trim()
      .min(20, "Add at least 20 characters so buyers know what to expect.")
      .max(1200, "Keep the description under 1,200 characters."),
    categorySlug: z.enum(categorySlugs),
    kind: z.enum(["physical", "digital"]),
    priceRupees: z
      .string()
      .trim()
      .regex(/^\d+(?:\.\d{1,2})?$/, "Enter a price with up to two decimal places.")
      .transform((value) => Math.round(Number(value) * 100))
      .pipe(
        z
          .number()
          .int()
          .min(100, "The minimum price is ₹1.")
          .max(10_000_000, "The maximum demo price is ₹1,00,000."),
      ),
    condition: z.enum(["new", "like-new", "good", "acceptable"]).optional(),
    format: z.string().trim().max(80, "Keep the format under 80 characters.").optional(),
  })
  .superRefine((listing, context) => {
    const category = resourceCategories.find((item) => item.slug === listing.categorySlug);
    if (category && !category.listingKinds.some((kind) => kind === listing.kind)) {
      context.addIssue({
        code: "custom",
        path: ["kind"],
        message: `${category.name} does not support ${listing.kind} listings.`,
      });
    }

    if (listing.kind === "physical" && !listing.condition) {
      context.addIssue({
        code: "custom",
        path: ["condition"],
        message: "Choose the item's condition.",
      });
    }
  });

export type ListingSubmission = z.output<typeof listingSubmissionSchema>;
