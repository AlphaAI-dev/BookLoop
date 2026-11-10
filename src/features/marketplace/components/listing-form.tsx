"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, Info, Plus, RotateCcw } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";

import { resourceCategories, type ListingKind } from "@/config/categories";
import { createDemoListing } from "@/features/marketplace/data/repository";
import { listingSubmissionSchema } from "@/features/marketplace/schemas/listing";
import type { NewListingInput } from "@/features/marketplace/types";

type FieldName = "title" | "description" | "categorySlug" | "kind" | "priceRupees" | "condition" | "format";
type FormValues = Record<FieldName, string>;

const initialValues: FormValues = {
  title: "",
  description: "",
  categorySlug: "",
  kind: "physical",
  priceRupees: "",
  condition: "",
  format: "",
};

export function ListingForm() {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [submitError, setSubmitError] = useState("");
  const [createdSlug, setCreatedSlug] = useState("");
  const [touched, setTouched] = useState(false);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const selectedCategory = resourceCategories.find((category) => category.slug === values.categorySlug);
  const allowedKinds: readonly ListingKind[] = selectedCategory?.listingKinds ?? ["physical", "digital"];

  useEffect(() => {
    if (submitError) errorSummaryRef.current?.focus();
  }, [submitError, errors]);

  function update<K extends FieldName>(field: K, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitError("");
    setCreatedSlug("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);
    const result = listingSubmissionSchema.safeParse({
      title: values.title,
      description: values.description,
      categorySlug: values.categorySlug,
      kind: values.kind,
      priceRupees: values.priceRupees,
      condition: values.condition || undefined,
      format: values.format,
    });

    if (!result.success) {
      const nextErrors: Partial<Record<FieldName, string>> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as FieldName;
        if (!nextErrors[field]) nextErrors[field] = issue.message;
      }
      setErrors(nextErrors);
      setSubmitError("A few details need your attention before this demo listing can be added.");
      return;
    }

    setErrors({});
    try {
      const parsed = result.data;
      const input: NewListingInput = {
        title: parsed.title,
        description: parsed.description,
        categorySlug: parsed.categorySlug,
        kind: parsed.kind as ListingKind,
        pricePaise: parsed.priceRupees,
        ...(parsed.kind === "physical" && parsed.condition ? { condition: parsed.condition } : {}),
        ...(parsed.format?.trim() ? { format: parsed.format.trim() } : {}),
      };
      const listing = createDemoListing(input);
      setCreatedSlug(listing.slug);
      setSubmitError("");
      setValues(initialValues);
      setTouched(false);
    } catch {
      setSubmitError("We couldn’t save this demo listing in your browser. Check local storage settings and try again.");
    }
  }

  function resetForm() {
    setValues(initialValues);
    setErrors({});
    setSubmitError("");
    setCreatedSlug("");
    setTouched(false);
  }

  function fieldClass(field: FieldName) {
    return `mt-2 w-full rounded-xl border bg-card px-3.5 py-3 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring ${errors[field] ? "border-destructive" : "border-input"}`;
  }

  return (
    <div className="page-container pb-20">
      <Link href="/browse" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><ArrowLeft aria-hidden="true" className="size-4" /> Browse resources</Link>
      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div className="rounded-[1.75rem] border border-border bg-card p-5 sm:p-8">
          <header className="mb-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Give a good resource its next home</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Create a demo listing</h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">This preview creates a listing in this browser only. It is not published to a marketplace or visible to other people.</p>
          </header>

          {createdSlug && (
            <div className="mb-6 rounded-2xl border border-success/30 bg-success/5 p-4" role="status">
              <div className="flex items-start gap-3"><CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-success" /><div><p className="font-semibold text-success">Your demo listing is ready</p><p className="mt-1 text-sm text-muted-foreground">It is stored locally in this browser and added to the browse shelf.</p><Link href={`/browse/${createdSlug}`} className="mt-3 inline-flex text-sm font-bold text-primary underline underline-offset-4">View your listing</Link></div></div>
            </div>
          )}
          {submitError && <div ref={errorSummaryRef} id="listing-errors" tabIndex={-1} role="alert" className="mb-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive focus:outline-none">{submitError}{Object.keys(errors).length > 0 && <ul className="mt-2 list-inside list-disc">{Object.entries(errors).map(([field, message]) => <li key={field}><a href={`#field-${field}`} className="underline underline-offset-2">{message}</a></li>)}</ul>}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="field-title" className="text-sm font-semibold">Listing title <span className="text-destructive">*</span></label>
                <input required id="field-title" className={fieldClass("title")} value={values.title} onChange={(event) => update("title", event.target.value)} onBlur={() => setTouched(true)} placeholder="e.g. Linear algebra notes, semester 2" aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? "error-title" : undefined} />
                {errors.title && <p id="error-title" className="mt-1.5 text-xs text-destructive">{errors.title}</p>}
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="field-description" className="text-sm font-semibold">What should the next student know? <span className="text-destructive">*</span></label>
                <textarea required id="field-description" className={`${fieldClass("description")} min-h-32 resize-y`} value={values.description} onChange={(event) => update("description", event.target.value)} placeholder="Share what’s included, what course it helped with, and any wear or useful context." aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? "error-description" : undefined} />
                <div className="mt-1.5 flex justify-between gap-4"><p id="error-description" className="text-xs text-destructive">{errors.description}</p><p className="ml-auto text-xs text-muted-foreground">{values.description.length}/1,200</p></div>
              </div>
              <div>
                <label htmlFor="field-categorySlug" className="text-sm font-semibold">Category <span className="text-destructive">*</span></label>
                <select required id="field-categorySlug" className={fieldClass("categorySlug")} value={values.categorySlug} onChange={(event) => { update("categorySlug", event.target.value); const cat = resourceCategories.find((item) => item.slug === event.target.value); if (cat && !cat.listingKinds.some((item) => item === values.kind)) update("kind", cat.listingKinds[0]); }} aria-invalid={Boolean(errors.categorySlug)} aria-describedby={errors.categorySlug ? "error-categorySlug" : undefined}>
                  <option value="">Choose a category</option>{resourceCategories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}
                </select>
                {errors.categorySlug && <p id="error-categorySlug" className="mt-1.5 text-xs text-destructive">{errors.categorySlug}</p>}
              </div>
              <div>
                <label htmlFor="field-kind" className="text-sm font-semibold">Resource kind <span className="text-destructive">*</span></label>
                <select required id="field-kind" className={fieldClass("kind")} value={values.kind} onChange={(event) => update("kind", event.target.value)} aria-invalid={Boolean(errors.kind)} aria-describedby={errors.kind ? "error-kind" : undefined}>
                  {allowedKinds.some((item) => item === "physical") && <option value="physical">Physical item</option>}
                  {allowedKinds.some((item) => item === "digital") && <option value="digital">Digital resource</option>}
                </select>
                {errors.kind && <p id="error-kind" className="mt-1.5 text-xs text-destructive">{errors.kind}</p>}
              </div>
              <div>
                <label htmlFor="field-priceRupees" className="text-sm font-semibold">Price in rupees <span className="text-destructive">*</span></label>
                <div className="relative"><span className="absolute top-1/2 left-3.5 -translate-y-1/2 text-sm text-muted-foreground">₹</span><input required id="field-priceRupees" inputMode="decimal" className={`${fieldClass("priceRupees")} pl-8`} value={values.priceRupees} onChange={(event) => update("priceRupees", event.target.value)} placeholder="e.g. 120.00" aria-invalid={Boolean(errors.priceRupees)} aria-describedby={errors.priceRupees ? "error-priceRupees" : undefined} /></div>
                {errors.priceRupees && <p id="error-priceRupees" className="mt-1.5 text-xs text-destructive">{errors.priceRupees}</p>}
              </div>
              {values.kind === "physical" ? (
                <div>
                  <label htmlFor="field-condition" className="text-sm font-semibold">Condition <span className="text-destructive">*</span></label>
                  <select required id="field-condition" className={fieldClass("condition")} value={values.condition} onChange={(event) => update("condition", event.target.value)} aria-invalid={Boolean(errors.condition)} aria-describedby={errors.condition ? "error-condition" : undefined}>
                    <option value="">Choose condition</option><option value="new">New</option><option value="like-new">Like new</option><option value="good">Good</option><option value="acceptable">Acceptable</option>
                  </select>
                  {errors.condition && <p id="error-condition" className="mt-1.5 text-xs text-destructive">{errors.condition}</p>}
                </div>
              ) : (
                <div>
                  <label htmlFor="field-format" className="text-sm font-semibold">File format <span className="text-xs font-normal text-muted-foreground">(optional)</span></label>
                  <input id="field-format" className={fieldClass("format")} value={values.format} onChange={(event) => update("format", event.target.value)} placeholder="PDF · 35 pages" aria-invalid={Boolean(errors.format)} aria-describedby={errors.format ? "error-format" : undefined} />
                  {errors.format && <p id="error-format" className="mt-1.5 text-xs text-destructive">{errors.format}</p>}
                </div>
              )}
            </div>
            <div className="mt-7 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-between">
              <button type="button" onClick={resetForm} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><RotateCcw aria-hidden="true" className="size-4" /> Clear form</button>
              <button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Plus aria-hidden="true" className="size-4" /> Add demo listing</button>
            </div>
          </form>
        </div>

        <aside className="rounded-2xl border border-primary/15 bg-accent/50 p-5 sm:p-6 lg:sticky lg:top-6">
          <div className="grid size-10 place-items-center rounded-xl bg-background text-primary"><Info aria-hidden="true" className="size-5" /></div>
          <h2 className="mt-4 text-lg font-semibold">A note about this preview</h2>
          <ul className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <li>New listings are kept in local storage on this browser and device only.</li>
            <li>They are not uploaded, published to other users, or backed up. Clearing browser data removes them.</li>
            <li>Do not include private details or copyrighted materials you do not have permission to share.</li>
          </ul>
          {touched && <p className="mt-5 border-t border-primary/10 pt-4 text-xs font-medium text-muted-foreground">Fields marked <span className="text-destructive">*</span> are required.</p>}
        </aside>
      </div>
    </div>
  );
}
