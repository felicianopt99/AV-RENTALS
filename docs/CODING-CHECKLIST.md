# Lightweight Coding Checklist

Use this before opening a PR or deploying.

## 1. Design & Domain
- [ ] Feature mapped to an existing domain folder or new one created logically
- [ ] Types / interfaces defined (no stray `any`)
- [ ] Zod schemas for all external inputs (API/body/query) and critical outputs

## 2. Architecture Alignment
- [ ] Repository + Service separation (no Prisma calls in React components)
- [ ] Error handling returns standardized shape `{ success, data?, error? }`
- [ ] Side effects (audit, realtime) in service layer only

## 3. UI Consistency
- [ ] Components use shadcn/ui + Tailwind tokens (`bg-card`, `text-muted-foreground`, etc.)
- [ ] No inline styles unless dynamic and unavoidable
- [ ] Responsive classes applied (check mobile breakpoint behavior)

## 4. State & Data Fetching
- [ ] React Query or custom hook used; no raw fetch calls inside UI without abstraction
- [ ] Loading + error states rendered clearly
- [ ] Avoid unnecessary global context; keep state local if possible

## 5. Quality & Safety
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes (if ESLint configured)
- [ ] Minimal tests for new service logic (if test harness exists) OR manual scenario documented
- [ ] No console.log left (except guarded debug flag)

## 6. Security & Validation
- [ ] Inputs validated (Zod) before DB writes
- [ ] Sensitive values never logged
- [ ] Auth/role checks applied where needed

## 7. Performance
- [ ] Expensive loops, queries, or renders reviewed
- [ ] Consider pagination / lazy loading for large lists
- [ ] Added caching strategy stub if feature will be high-volume later

## 8. Realtime (if applicable)
- [ ] Event emitted after write (`feature:event`) following existing naming convention
- [ ] Client subscription updated (hook listens and merges state)

## 9. Documentation
- [ ] Updated README section or feature docs if public-facing
- [ ] Added any new ENV VARS to `.env.example`

## 10. Deployment Readiness
- [ ] Backup created before prod deploy
- [ ] Build tested locally (`npm run build`)

Keep it simple. If a box can’t be checked, leave a short note in the PR description.