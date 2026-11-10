---
name: Dependency setup side effects
description: Preserving imported dependency pins and configuration during Replit setup
---

Inspect manifest, lockfile and Replit-configuration diffs after installing existing dependencies;
preserve upstream pins unless a dependency change is explicitly approved.

**Why:** The package installer changed an exact Next.js pin to a range and adjusted Replit
configuration even though the requested package version was already declared.

**How to apply:** Review setup diffs before feature edits. If restoring `.replit`, use the
validated `verifyAndReplaceDotReplit` flow with temporary TOML; direct edits are blocked.
