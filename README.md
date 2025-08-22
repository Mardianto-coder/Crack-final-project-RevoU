# Next.js LMS 

A minimal Learning Management System built with:

- Next.js 14 (App Router, Server Actions, ISR)
- TypeScript + TailwindCSS
- Prisma (PostgreSQL)
- NextAuth (Credentials, demo only)
- REST API routes for courses, enrollments, and progress

## Quickstart

1. Install deps:

```bash
pnpm i # or npm i or yarn
```

2. Copy envs:

```bash
cp .env.example .env
# edit DATABASE_URL + NEXTAUTH_SECRET
```

3. Set up DB and seed:

```bash
pnpm prisma:push
pnpm seed
```

4. Run dev server:

```bash
pnpm dev
```

Open http://localhost:3000

### Demo Accounts

- student@example.com / password
- instructor@example.com / password

## API

- `GET /api/courses` — list courses
- `POST /api/courses` — create (instructor/admin)
- `GET /api/courses/:id` — fetch one
- `PUT /api/courses/:id` — update (instructor/admin)
- `DELETE /api/courses/:id` — delete (instructor/admin)
- `POST /api/enroll` — enroll authenticated user `{ courseId }`
- `POST /api/progress` — update progress `{ courseId, completedLessonId?, score? }`
- `POST /api/revalidate` — revalidate ISR `{ path }`

## Notes

- This is a starter; extend with proper UI (component library), client quiz UI, admin CMS, etc.
- For production auth, add OAuth providers and email verification.
- Consider RLS or row-level access patterns if you ever expose direct SQL.
