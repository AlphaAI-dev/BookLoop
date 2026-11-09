/**
 * Static site metadata and navigation.
 *
 * Only link to routes that exist. Feature branches add their nav entries
 * when they ship the corresponding route.
 */

export type NavItem = {
  title: string;
  href: string;
  description?: string;
};

export const siteConfig = {
  name: "BookLoop",
  tagline: "The marketplace for academic resources",
  description:
    "Buy and sell used textbooks, original study notes, academic equipment and exam-prep resources from students, educators and independent creators.",
  mainNav: [
    { title: "Browse", href: "/browse", description: "Discover textbooks, notes and more" },
    { title: "Sell", href: "/sell", description: "List a physical or digital resource" },
    { title: "How it works", href: "/#how-it-works" },
  ] satisfies NavItem[],
  footerNav: [
    { title: "Browse", href: "/browse" },
    { title: "Sell", href: "/sell" },
    { title: "How it works", href: "/#how-it-works" },
  ] satisfies NavItem[],
} as const;

export type SiteConfig = typeof siteConfig;
