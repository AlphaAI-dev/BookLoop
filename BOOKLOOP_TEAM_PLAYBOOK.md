# BookLoop Engineering Team Playbook

**Version:** 1.0 \| **Date:** 10 November 2026 \| **Status:** Working
source of truth

## 1. Purpose

This document is the shared source of truth for the human team, Claude
Code and Replit. It defines product scope, architecture,
responsibilities, Git workflow, database rules, quality gates and
delivery.

**No agent may independently change product scope, architecture,
dependencies, payment design, database conventions or acceptance
criteria.** If something is unclear, stop, explain the uncertainty and
ask the project owner. Do not invent a decision.

## 2. Product definition

BookLoop is an online-first marketplace connecting students, educators
and independent creators with buyers of academic resources.

Categories to validate: - Used textbooks - Original student notes and
study guides - Academic equipment - Exam-preparation resources -
Original educational digital resources

Listing types: - **Physical:** condition, images and fulfilment details
required. - **Digital:** seller must have the right to distribute the
resource; files must be private and access-controlled.

Roles: buyer, student seller, creator/educator and admin. One account
can act as both buyer and seller. Admin privileges must never be
self-assigned.

MVP user journey: register/profile → discover/search → listing detail →
create physical or digital listing → order → payment-provider test
checkout → verified digital access or physical fulfilment → report
content.

AI is secondary to a reliable marketplace. Initial AI scope: metadata
suggestions, semantic search and optional visible-condition suggestions.
AI outputs must be reviewable by a human.

## 3. Locked technical decisions

  -----------------------------------------------------------------------
  Area                                Decision
  ----------------------------------- -----------------------------------
  Framework                           Next.js App Router

  Language                            TypeScript, strict mode

  Styling                             Tailwind CSS; shadcn/ui where
                                      useful

  Database                            Supabase PostgreSQL

  Authentication                      Supabase Auth

  File storage                        Supabase Storage; private bucket
                                      for paid digital assets

  Payments                            Razorpay candidate; test mode until
                                      marketplace approval

  Validation                          Zod

  Source control                      GitHub

  Development                         Claude Code and Replit

  Deployment                          Replit

  Database changes                    Versioned Supabase CLI migrations
  -----------------------------------------------------------------------

Do not add another database, ORM, payment gateway, UI framework or AI
provider without approval. If a change is necessary, report options and
trade-offs first.

Use Supabase Free for development and early validation. Monitor
database, storage, egress and inactivity. Do not store uploaded files as
database blobs. Upgrade only after owner approval.

## 4. Team roles and authority

### Human project owner

The owner makes product decisions and approves releases.
Responsibilities: - Approve scope, priorities and architecture
changes. - Approve branches, PRs and merges. - Create Supabase/payment
accounts and provide credentials through secret managers. - Review user
flows and product quality. - Approve production deployment and live
payments. - Resolve agent questions.

Never paste secrets into chat, source files, commits or issue
descriptions.

### Claude Code --- primary engineering agent

Responsible for: - Inspecting the repository before editing. -
Implementing only assigned work in the assigned branch. - Writing
maintainable, typed code and tests. - Creating migration files for
assigned database work. - Running typecheck, lint, tests and production
build. - Reviewing its diff for security, regressions and scope drift. -
Reporting changed files, commands run, actual results, limitations and
blockers.

Must not: - Push directly to `main` or merge its own PR. - Deploy
production without approval. - Change the remote schema manually. -
Invent credentials or bypass payment verification. - Silently add
dependencies or alter architecture. - Claim tests passed unless they ran
and passed.

### Replit --- runtime, integration and deployment environment

Responsible for: - Opening/running the approved repository. - Providing
Shell, preview and deployment environment. - Holding environment secrets
in Replit Secrets. - Running approved build/test commands. - Verifying
deployed URL and key flows. - Reporting runtime and deployment failures.

Replit Agent may edit code only when explicitly assigned. If it edits
code, it follows the same branch, PR, test and approval rules as Claude
Code. It must not independently redesign architecture, replace
dependencies, alter schema outside migrations or deploy unreviewed code.

### Supabase

Managed database, authentication and storage. Schema and policy changes
must be represented in migration files committed to GitHub.

### GitHub

Canonical source for code, branches, PRs, migrations and review records.
Replit and Claude Code work from the same repository and agreed branch
names.

## 5. Git and branch policy

Branches: - `main`: stable, deployable; protected; no direct agent
pushes. - `develop`: integration branch. - `feature/<name>`: one
independently reviewable feature. - `fix/<name>`: one specific defect. -
`chore/<name>`: maintenance.

Examples: `feature/project-foundation`, `feature/supabase-auth`,
`feature/database-schema`, `feature/marketplace-search`,
`feature/listings`, `feature/dashboard`, `feature/payments`,
`feature/ai`.

Create `develop` from `main` once. Create feature branches from the
latest `develop`. Merge feature PRs into `develop`, not directly into
`main`. Merge `develop` into `main` only after integration acceptance.

Agent isolation: - One agent owns one feature branch at a time. - Never
assign two agents to the same branch simultaneously. - Avoid concurrent
edits to shared files such as `package.json`, global layout, shared
types, Supabase client setup and migration history. - Assign one
migration owner per migration batch. - Branch isolation does not isolate
a shared remote database; coordinate schema changes.

Every PR must include purpose/scope, acceptance criteria, changed files,
migration details, environment variable names (never values),
commands/tests actually run, UI screenshots where relevant, limitations
and confirmation that no secrets or unrelated files were committed.

The owner reviews and merges. Reject or request changes if tests fail,
scope is exceeded, security is weakened or implementation is unclear.

## 6. Supabase setup and database rules

Create one Supabase project for development/pilot. Use the project URL
and public anon/publishable key in the app. Keep the service-role key
server-side only.

Suggested buckets: - `listing-images`: listing photographs; restrict
upload type and size. - `digital-resources`: private bucket; paid files
are never public. - `avatars`: public or controlled access depending on
profile design.

Use `.env.example` with placeholders. Real values go into ignored
`.env.local` and Replit Secrets.

Variable names: - `NEXT_PUBLIC_SUPABASE_URL` -
`NEXT_PUBLIC_SUPABASE_ANON_KEY` - `SUPABASE_SERVICE_ROLE_KEY` (server
only) - `RAZORPAY_KEY_ID` - `RAZORPAY_KEY_SECRET` (server only) -
`RAZORPAY_WEBHOOK_SECRET` (server only) - `AI_PROVIDER_API_KEY` (server
only, if used) - `NEXT_PUBLIC_APP_URL`

Never commit `.env`, `.env.local`, service-role keys, payment secrets,
webhook secrets or AI API keys. Never expose private keys with a
`NEXT_PUBLIC_` prefix.

### Migration policy

All schema, index, function, trigger and RLS policy changes must be
committed under `supabase/migrations/`.

Rules: 1. Never make an untracked schema change directly in the shared
remote project. 2. Create a named migration for each coherent schema
change. 3. Test migrations against a local/dev database before applying
remotely. 4. Commit migration files with the feature branch. 5. After
merge, the designated database owner applies the migration to the shared
remote project. 6. Only one person/process applies remote migrations at
a time. 7. If migration history diverges, stop and reconcile; never
blindly repair/reset remote data. 8. Keep seed data separate from
production data.

Typical CLI workflow after installing/configuring the Supabase CLI:

``` bash
supabase login
supabase init
supabase link --project-ref YOUR_PROJECT_REF
supabase migration new create_profiles_and_categories
# Edit generated SQL.
supabase db reset
supabase migration list
# Only after review and approval:
supabase db push
```

Use the local Supabase stack when Docker is available. Otherwise use a
separate development Supabase project, still with versioned migrations.
Never experiment directly on production data.

### Row Level Security

Enable RLS on every table exposed through Supabase client APIs.
Explicitly test policies for: - Public reading of active, approved
listings only. - Users reading/updating their own profile within allowed
fields. - Sellers managing only their own listings. - Buyers reading
only their own orders. - Sellers reading only order items associated
with their listings. - Digital asset access only after verified purchase
entitlement. - Admin actions through trusted server-side authorization.

Hiding a UI button is not authorization. Enforce access in database and
server layers.

## 7. Payment and fulfilment rules

Razorpay is a candidate provider. Use test mode until the provider
confirms the intended third-party marketplace model, seller
onboarding/KYC, settlement and commission arrangements are permitted and
supported.

1.  Backend creates provider order.
2.  Backend calculates amount from database prices; browser totals are
    untrusted.
3.  Store money as integer paise.
4.  Verify checkout signature server-side.
5.  Confirm captured/paid state through provider API and/or verified
    webhook.
6.  Verify webhook signature using raw request body and webhook secret.
7.  Store provider event IDs and process idempotently.
8.  Never mark paid from a frontend callback alone.
9.  Do not grant downloads or start fulfilment before verified payment.
10. Do not claim escrow or seller split payouts unless provider approval
    and capability are confirmed.
11. Refunds and payouts require explicit server workflows and audit
    records.

Digital fulfilment: private storage, entitlement check, short-lived
signed URL, download audit. Physical fulfilment: seller notification,
pickup/shipping details, status and completion.

## 8. Security baseline

-   Strict TypeScript and server-side Zod validation.
-   Authentication and authorization on every protected operation.
-   RLS enabled and tested.
-   Private paid-resource storage.
-   No secrets in source control, logs or client bundles.
-   Validate file extension, MIME type, size and ownership.
-   Rate-limit signup, upload, AI and payment endpoints.
-   Prevent self-purchases and client-side price/seller-ID manipulation.
-   Keep payment and moderation audit events.
-   Provide content reporting and takedown workflow.
-   Do not distribute copyrighted material without rights.
-   Minimise personal data collection.

## 9. Implementation phases

  -----------------------------------------------------------------------
  Phase             Work              Primary owner     Gate
  ----------------- ----------------- ----------------- -----------------
  0                 Inspect repo,     Claude Code;      Clean baseline
                    branch setup,     owner approves    
                    conventions                         

  1                 Next.js           Claude Code       App runs/builds
                    foundation,                         
                    responsive shell,                   
                    design system                       

  2                 Supabase clients, Claude Code;      DB/security tests
                    migrations, RLS,  owner controls    
                    storage           credentials and   
                                      remote apply      

  3                 Auth and profiles Claude Code       Auth tests

  4                 Marketplace       Claude Code       Search/detail
                    search,                             tests
                    categories,                         
                    listing detail                      

  5                 Physical and      Claude Code       Listing/upload
                    digital listing                     tests
                    workflows                           

  6                 Buyer/seller      Claude Code       Role/ownership
                    dashboards                          tests

  7                 Cart, orders,     Claude Code;      Payment test
                    payment test      owner approves    suite
                    mode, webhooks    provider setup    

  8                 Digital           Claude Code       Fulfilment tests
                    entitlements and                    
                    physical                            
                    fulfilment                          

  9                 AI metadata,      Claude Code       Evaluation and
                    semantic search,                    human review
                    condition                           
                    assistance                          

  10                Integration,      Replit runtime;   Release checklist
                    responsive QA,    Claude Code fixes 
                    deployment                          
  -----------------------------------------------------------------------

Do not start all phases concurrently. Stabilise foundation and database
conventions first.

## 10. Acceptance criteria and quality gates

Every feature requires a user story, written acceptance criteria, unit
tests for business logic, integration tests for database/API behaviour,
end-to-end tests for critical journeys where practical, responsive
checks at mobile/tablet/desktop widths, and security/authorization
checks.

Establish and run scripts appropriate to `package.json`, at minimum:

``` bash
npm run lint
npx tsc --noEmit
npm run build
```

Add test scripts when the test framework is selected. Do not report a
command as passing unless it ran.

### P0 release acceptance

-   Signup, email verification, login and logout work.
-   User profile is editable by its owner only.
-   Seller can create, edit, publish and archive own listings.
-   Physical and digital listing types are distinct and validated.
-   Search and filters return active listings accurately.
-   Listing detail shows accurate seller, price and resource details.
-   Buyer can create an order; server computes its total.
-   Payment test flow handles success, failure, retry and mismatch.
-   Invalid signatures cannot mark an order paid.
-   Duplicate webhooks do not duplicate fulfilment.
-   Unpaid users cannot access paid digital files.
-   Paid buyers can access eligible digital files.
-   Physical orders have a fulfilment status workflow.
-   Unauthorized users cannot read/modify another user's private data.
-   Admin actions require trusted admin authorization.
-   Deployed URL loads and critical flows are tested.

### P1

-   AI metadata extraction with seller confirmation.
-   Semantic search.
-   Visible book-condition suggestions.
-   Creator storefront enhancements and analytics.

### Required negative tests

-   Anonymous protected action.
-   User edits another user's profile.
-   Seller edits another seller's listing.
-   User assigns self admin.
-   Buyer reads another buyer's order.
-   Invalid/oversized file upload.
-   Unpaid access to private file.
-   Inactive listing purchase.
-   Altered browser amount.
-   Self-purchase.
-   Invalid signature.
-   Duplicate webhook.
-   Payment amount mismatch.
-   Download entitlement before payment verification.

Responsive checks: mobile navigation, listing cards and filters, forms
and validation, loading/empty/error/success states, keyboard
focus/labels and no horizontal overflow.

## 11. Agent task contract

Every task assigned to Claude Code or Replit must use:

**Task ID:**\
**Branch:**\
**Agent:**\
**Objective:**\
**In scope:**\
**Out of scope:**\
**Files/modules allowed to change:**\
**Dependencies:**\
**Acceptance criteria:**\
**Tests required:**\
**Migration required:** yes/no\
**Environment variable names required:**\
**Questions/blockers:** stop and ask before assuming.

At completion, agent reports: 1. Implementation summary. 2. Files
changed. 3. Migration files added/changed. 4. Commands actually
executed. 5. Test results: pass/fail/not run. 6. Security
considerations. 7. UI screenshots/demo evidence where relevant. 8. Known
issues/deferred items. 9. Branch/PR reference. 10. Assumptions made.

## 12. Initial task assignments

### BL-001 --- Repository inspection and foundation

**Agent:** Claude Code\
**Branch:** `feature/project-foundation`

Inspect the existing repository and establish Next.js TypeScript without
destroying existing work.

Deliver: - Repository assessment. - Existing app/package manager
detection. - Next.js App Router + TypeScript setup if missing. -
Tailwind and lint configuration. - Folder conventions. - `.env.example`
with placeholders only. - `.gitignore` verification. - README setup
instructions. - Working dev server and production build.

Out of scope: Supabase schema, payments, AI, or rebuilding an already
approved landing page without permission.

Acceptance: - Existing files preserved unless changes are explained. -
`npm run dev` works. - lint, typecheck and build pass. - No secrets
committed. - PR opened against `develop`.

### BL-002 --- Supabase foundation

**Agent:** Claude Code\
**Branch:** `feature/supabase-foundation` (start after BL-001
conventions are agreed)

Deliver: - Browser and server Supabase clients. - Typed environment
configuration. - Versioned initial schema migrations. - RLS policies. -
Storage setup/policies. - Seed data for local/demo use. - Database tests
or reproducible verification checklist.

Human owner creates the Supabase project and enters credentials in
secret managers. Only owner/designated database operator applies
migrations to shared remote project.

### BL-003 --- Marketplace UI shell

**Agent:** one assigned agent only\
**Branch:** `feature/marketplace-shell`

Build responsive marketplace, category navigation, listing cards,
search/filter UI and listing detail pages using typed mock data until
database integration is approved.

Out of scope: payment processing, real file uploads, architecture
changes or unapproved features.

Acceptance: mobile/tablet/desktop layouts, loading/empty/error states,
accessible navigation, reusable components and no unrelated edits.

## 13. Definition of done

A task is done only when it meets written acceptance criteria, tests
have been run and reported, no known critical security issue remains,
scope is respected, code is committed to its feature branch and a PR is
ready for owner review. A feature is not done merely because a page
renders or an agent says it is complete.

## 14. First actions for the owner

1.  Inspect the existing GitHub repository.
2.  Create `develop` from `main`.
3.  Clone the repo locally or open that same repo in Replit.
4.  Check Node.js is 20.9 or later.
5.  Create a Supabase Free project for development/pilot.
6.  Store credentials in ignored local environment files and Replit
    Secrets.
7.  Assign BL-001 to Claude Code.
8.  Review the foundation PR before starting database and feature work.
9.  Manage database changes only through reviewed migrations.
10. Keep payments in test mode until provider approval is confirmed.

**Operating principle:** one source of truth, one owner per task, one
reviewed PR per feature, versioned database changes and measurable
acceptance criteria.
