# Project Roadmap

A simplicity-first, “just works” plan to keep translations automatic and maintenance-light, while remaining production-grade.

## Vision & SLOs
- Availability: 99.9% (RTO ≤ 30m, RPO ≤ 15m)
- Latency: p95 API ≤ 300ms (translate cache hits ≤ 150ms; misses ≤ 500ms)
- Error budget: 0.1%/month; alert on fast burn
- Security: no critical vulns in prod; secrets rotated quarterly

## Core Decisions
- No locale-prefixed routes; single site structure
- Cookie is the source of truth for language: `app-language` ∈ {`en`,`pt`}
- DeepL as sole MT provider; Prisma DB is the cache of truth for translations
- Auto-discovery + auto-seeding of new UI strings

## Scope Overview
- S1: SSR-consistent language; fix `<html lang>` and hreflang alternates
- S2: Auto-discover & auto-seed strings (extractor, seed, coverage API/UI)
- S3: Generated per-route preloader manifest (replace hardcoded arrays)
- S4: Guardrails: rate limiting, batch caps; admin endpoints require auth
- S5: DX CLI: scan, seed, export; optional pre-commit hint
- S6: Cleanup: remove invalid hook usage in server route, set Prisma default to `deepl`, cookie hardening

---

## ✅ Week 1 - Completed on 2025-11-28
- [x] S1: SSR language consistency
  - [x] Middleware: set `app-language` from Accept-Language if missing (en/pt)
  - [x] `layout.tsx`: read cookie and render `<html lang>` dynamically
  - [x] Remove/adjust `alternates.languages` to match no `/pt` route
- [x] S6: Cleanup
  - [x] Remove client-hook usage from `/api/translate/models/route.ts`; use static strings
  - [x] Prisma: change `Translation.model` default to `"deepl"`
  - [x] Cookie attributes: `SameSite=Lax; Secure` (when HTTPS)
- [x] S4: Guardrails (minimal)
  - [x] Rate limit `/api/translate` (per IP/session), cap batch size (≤ 100 texts)
  - [x] Keep admin translation endpoints behind auth; public translate remains rate-limited

### Deployment Notes for Week 1
- Prisma migration applied: `set-translation-model-default-deepl`
- Middleware now handles language detection and cookie setting
- Rate limiting is in-memory (single instance only)
- For production, consider implementing a distributed rate limiter (e.g., Redis)
- Application needs to be rebuilt and restarted to apply all changes

Deliverables
- Middleware added; `layout.tsx` updated
- Alternates fixed or removed; `<html lang>` correct
- Server route hook misuse removed; Prisma default updated
- Reduction of login/page flicker events
- No 404s from incorrect hreflang
- Translate API 4xx/429 within expected thresholds (no abuse)

KPIs
- Reduction of login/page flicker events
- No 404s from incorrect hreflang
- Translate API 4xx/429 within expected thresholds (no abuse)

Status: Completed

Post-Deployment Actions
- Run Prisma migration to apply default change: `npx prisma migrate dev -n set-translation-model-default-deepl`
- Redeploy/restart app so middleware and API changes take effect

Notes
- Current rate limiter is in-memory and per-instance; for multi-instance deploys, plan to switch to Redis in Week 2/3.

---

## Week 2

Automate translations and visibility for new strings.

- S2: Auto-discover & auto-seed
  - Extractor script to scan TS/TSX literals and common UI components
  - `translations:seed` CLI/API to DeepL-translate missing strings → DB
  - Coverage endpoint `/api/i18n/coverage` powering Admin “Coverage” tab
- S5: DX
  - CLI: `translations:scan`, `translations:seed`, `translations:export`
  - Optional pre-commit warning if large new string set detected and not seeded

Deliverables
- Extractor + seed workflow; coverage wired into Admin UI
- CI job (optional) to run scan + seed on main with guardrails

KPIs
- Coverage % increases over time; missing strings trend down
- Seed time within a few seconds for typical diffs

---

## Week 3

Remove manual preloader maintenance and finalize tooling.

- S3: Generated preloader manifest
  - Build-time generation of per-route translation manifest from extractor
  - Replace hardcoded arrays in `RouteTranslationPreloader` with generated manifest
- S5: DX polish
  - Documentation for CLI usage and contribution guidelines
  - Optional pre-commit hook integration

Deliverables
- Preloader is data-driven; no manual lists
- Developer docs and scripts in place

KPIs
- Zero manual edits to preloader for new routes/strings
- Stable cache hit rates on route transitions

---

## Operational Baseline (Ongoing)

- Logging: structured, minimal noise for translation paths
- Metrics: cache hit rate, DeepL latency/error rate, batch queue depth
- Alerts: error budget burn, DeepL 5xx/429 spikes, low cache hit rate (<80%)
- Backups/PITR: daily full + PITR; quarterly restore test

---

## Open Decisions

- Public translate API: keep accessible with rate limits (default) vs. require auth token
- CI auto-seed: enable on main or manual via release checklist

---

## Commands & Scripts (to be added)

- `pnpm translations:scan` — extract new strings
- `pnpm translations:seed` — seed missing to DB via DeepL
- `pnpm translations:export` — export JSON per language for audits

---

## Acceptance Criteria

- Week 1 changes deployed with no user-facing regressions
- Coverage tab functional with accurate stats
- New UI strings appear translated after scan+seed without manual editing
- Route preloader requires no manual updates after Week 3
