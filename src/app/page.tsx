import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Calculator,
  ClipboardCheck,
  FileLock2,
  Flag,
  GraduationCap,
  type LucideIcon,
  MonitorDown,
  NotebookPen,
  Search,
  ShoppingBag,
  Upload,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type CategoryIcon, resourceCategories } from "@/config/categories";

const categoryIcons: Record<CategoryIcon, LucideIcon> = {
  textbook: BookOpen,
  notes: NotebookPen,
  equipment: Calculator,
  exam: ClipboardCheck,
  digital: MonitorDown,
};

const steps = [
  {
    icon: Search,
    title: "Discover",
    description: "Search by course, subject or title across physical and digital resources.",
  },
  {
    icon: ShoppingBag,
    title: "Order securely",
    description: "Prices are set by the server, and an order is only confirmed once the payment provider has verified it.",
  },
  {
    icon: Upload,
    title: "Sell what you've finished with",
    description: "List a used textbook, or publish original notes you have the right to share.",
  },
] satisfies { icon: LucideIcon; title: string; description: string }[];

const principles = [
  {
    icon: BadgeCheck,
    title: "Verified payments",
    description: "Payments are checked on the server before anything is released.",
  },
  {
    icon: FileLock2,
    title: "Private digital files",
    description: "Paid files stay in private storage and are only available to verified buyers.",
  },
  {
    icon: Flag,
    title: "Report and takedown",
    description: "Anyone can report a listing that breaks the rules or infringes copyright.",
  },
] satisfies { icon: LucideIcon; title: string; description: string }[];

export default function HomePage() {
  return (
    <>
      <section className="border-b bg-gradient-to-b from-secondary/70 to-background">
        <div className="page-container grid gap-10 py-14 md:py-20 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div className="space-y-6">
            <Badge variant="highlight" className="gap-1.5">
              <GraduationCap aria-hidden="true" />
              Built for students, educators and creators
            </Badge>
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              Pass your course materials on. Find the ones you need.
            </h1>
            <p className="max-w-xl text-lg text-pretty text-muted-foreground">
              BookLoop is a marketplace for used textbooks, original study notes, academic
              equipment and exam-prep resources, in both physical and digital form.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/browse">
                  Browse resources
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/sell">Start selling</Link>
              </Button>
            </div>
          </div>

          <Card className="gap-4 shadow-md">
            <CardHeader>
              <CardTitle>Two ways to list</CardTitle>
              <CardDescription>Every listing is either physical or digital.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <div className="rounded-lg border bg-background p-4">
                <Badge variant="secondary">Physical</Badge>
                <p className="mt-2 text-sm text-muted-foreground">
                  Condition, photos and pickup or shipping details.
                </p>
              </div>
              <div className="rounded-lg border bg-background p-4">
                <Badge variant="info">Digital</Badge>
                <p className="mt-2 text-sm text-muted-foreground">
                  Original files only, downloaded securely after purchase.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section aria-labelledby="categories-heading" className="page-container py-14 md:py-20">
        <div className="mb-8 space-y-2">
          <h2 id="categories-heading" className="text-2xl font-semibold tracking-tight md:text-3xl">
            What you&apos;ll find
          </h2>
          <p className="text-muted-foreground">Five categories to start with.</p>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {resourceCategories.map((category) => {
            const Icon = categoryIcons[category.icon];
            return (
              <li key={category.slug}>
                <Card className="h-full gap-4 py-5">
                  <CardHeader className="px-5">
                    <span className="mb-2 inline-flex size-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <CardTitle>{category.name}</CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto flex flex-wrap gap-1.5 px-5">
                    {category.listingKinds.map((kind) => (
                      <Badge key={kind} variant={kind === "digital" ? "info" : "secondary"}>
                        {kind === "digital" ? "Digital" : "Physical"}
                      </Badge>
                    ))}
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      </section>

      <section
        id="how-it-works"
        aria-labelledby="how-heading"
        className="scroll-mt-20 border-y bg-muted/40"
      >
        <div className="page-container py-14 md:py-20">
          <h2 id="how-heading" className="mb-8 text-2xl font-semibold tracking-tight md:text-3xl">
            How it works
          </h2>
          <ol className="grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span
                  aria-hidden="true"
                  className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
                >
                  <step.icon className="size-5" />
                </span>
                <div className="space-y-1">
                  <h3 className="font-semibold">
                    <span className="sr-only">Step {index + 1}: </span>
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="trust-heading" className="page-container py-14 md:py-20">
        <h2 id="trust-heading" className="mb-8 text-2xl font-semibold tracking-tight md:text-3xl">
          Built to be trustworthy
        </h2>
        <ul className="grid gap-4 md:grid-cols-3">
          {principles.map((item) => (
            <li key={item.title}>
              <Card className="h-full gap-3 py-5 shadow-none">
                <CardHeader className="px-5">
                  <item.icon className="mb-2 size-6 text-primary" aria-hidden="true" />
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
