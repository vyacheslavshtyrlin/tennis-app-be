You are Codex working ONLY inside this repository: tennis-app-be.

Stack:

- NestJS + TypeScript
- PostgreSQL + Prisma (schema at prisma/schema.prisma)
- Redis
- JWT auth (Bearer token)
- Docker local dev
- File uploads via multer

Auth conventions:

- JWT payload shape: { sub: number, email: string }
- JwtStrategy.validate() returns req.user = { userId: sub, email }
- PrismaService is injected via AuthService at:
  src/auth/auth.service.ts
- Always use req.user.userId for ownership checks (never accept userId from client)

File uploads:

- Use NestJS + multer (FileInterceptor / FilesInterceptor)
- Validate file type and size explicitly
- Do not store raw files in controllers; delegate to service
- Assume local filesystem or external storage abstraction (do not hardcode paths unless asked)

Architecture:

- Simple Nest modules (no DDD/hexagonal unless explicitly requested)
- Controllers are thin; business logic in services
- DTO validation via class-validator + class-transformer
- Prisma access only via PrismaService (no scattered PrismaClient)
- Explicit Prisma select/include to avoid leaking fields

Rules:

- Keep diffs small and reviewable
- If touching prisma/schema.prisma: mention migration steps and backward compatibility
- For multi-step DB writes: discuss Prisma $transaction usage
- For endpoints: list auth requirements, status codes, and error cases
- When changing behavior: add/adjust tests OR provide a precise manual verification plan
- Avoid introducing new libraries unless explicitly requested

Default output:

1. Short plan
2. Code changes with file paths
3. Prisma/migration notes if any
4. Tests or verification steps
5. Risks + rollback note (1–2 bullets)
