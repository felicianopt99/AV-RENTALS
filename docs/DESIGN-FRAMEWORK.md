# AV-RENTALS Design Framework

This playbook gives you a simple, repeatable way to build features so your code always “feels” consistent with the project design.

## Core principles

- Type-safe by default: define types and Zod schemas first.
- Separation of concerns: components (UI) don’t know data access details.
- Single source of truth: services own business rules; repositories own DB access.
- Predictable data flow: validate -> service -> repo -> emit events -> return typed result.

## Where things live (without moving the repo around)

- Routes and pages: `src/app/**`
- UI components: `src/components/**` (domain folders already exist)
- Cross-cutting libraries: `src/lib/**` (api helpers, db, utils, pdf, etc.)
- Hooks: `src/hooks/**`
- Types: `src/types/**`
- Prisma models/migrations: `prisma/**`

Optional per-feature structure (kept close to current layout):
- `src/components/<feature>/**` — Presentational and feature components
- `src/hooks/use<Feature>*.ts` — Data fetching and state for that feature
- `src/lib/schemas/<feature>.ts` — Zod request/response DTOs
- `src/lib/services/<feature>Service.ts` — Business logic
- `src/lib/repositories/<feature>Repository.ts` — Interface + Prisma impl

## Feature recipe (checklist)

1) Define contracts
- Add Zod schemas in `src/lib/schemas/<feature>.ts` for inputs/outputs
- Add TypeScript types in `src/types` if they’re reused broadly

2) Implement repository and service
- Repository: interface first (ports), then Prisma implementation (adapters)
- Service: business rules, transactions, audit, and realtime notifications

3) Wire API route
- In `src/app/api/<feature>/route.ts` (or nested), do:
  - Parse/validate request with Zod
  - Call service methods
  - Return a consistent JSON payload

Standard API response shape:
```
{ success: boolean; data?: T; error?: { code: string; message: string; details?: any } }
```

4) Hook + UI
- Create a `use<Feature>` hook to encapsulate fetching/mutations
- Build components in `src/components/<feature>` using shadcn/ui and Tailwind tokens
- Keep components pure; side effects belong in hooks/services

5) Tests (minimum)
- Unit test service (happy path + one validation error)
- If adding a complex component, a simple render test

6) Done criteria
- Types and Zod schemas exist for all inputs/outputs
- API returns the standard shape with proper error codes
- No `any` in changed files; no unhandled promise rejections
- UI uses design tokens (Tailwind CSS vars) and shadcn/ui

## Coding conventions that matter most

- Naming
  - Files: `kebab-case.ts`; React components: `PascalCase.tsx`
  - Hooks start with `use*` and return `{ data, isLoading, error, ... }`
  - Repositories end with `Repository`, services end with `Service`

- Error handling
  - Validate request with Zod; surface 400 on validation, 404 on missing, 409 on conflicts
  - Wrap service/repo calls and map to `{ success: false, error }`

- Styling
  - Use Tailwind tokens from `tailwind.config.ts` (e.g., `bg-card`, `text-muted-foreground`)
  - Prefer utility classes + shadcn/ui; avoid inline styles

- Realtime (when applicable)
  - After writes, emit an event via the realtime layer (see `useRealTimeSync`)

## Minimal templates

Service template:
```ts
export class ExampleService {
  constructor(
    private readonly repo: ExampleRepository,
    private readonly audit: AuditService,
    private readonly realtime: RealtimeService,
  ) {}

  async create(input: CreateExampleInput, userId: string) {
    // business rules
    const entity = await this.repo.create(input)
    await this.audit.logAction('example:created', entity.id, userId)
    this.realtime.broadcast('example:created', entity)
    return entity
  }
}
```

API route template:
```ts
import { z } from 'zod'
import { NextResponse } from 'next/server'
import { CreateSchema } from '@/lib/schemas/example'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const input = CreateSchema.parse(body)
    const result = await exampleService.create(input, 'current-user-id')
    return NextResponse.json({ success: true, data: result })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION', message: 'Invalid input', details: err.flatten() } }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: { code: 'UNKNOWN', message: 'Unexpected error' } }, { status: 500 })
  }
}
```

Hook template:
```ts
export function useExample() {
  const [data, setData] = useState<Example[] | null>(null)
  const [isLoading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // fetch/mutate logic here
  return { data, isLoading, error }
}
```

## Quick PR checklist ✅

- [ ] Zod schemas + types exist
- [ ] Service + repo separated and tested (minimally)
- [ ] API uses standard response shape
- [ ] UI follows shadcn + Tailwind tokens
- [ ] No `any` or console logs (prod)
- [ ] Basic happy-path test passes locally

---
Keep this page open when coding. Follow the recipe and the project will stay consistent without heavy process.