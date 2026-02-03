# Tennis Tracker Backend

NestJS + Prisma backend for Tennis Tracker with PostgreSQL, Redis queue, and file uploads for original and processed match videos.

## Stack
- NestJS, Swagger
- PostgreSQL + Prisma
- Redis (jobs_queue) for worker tasks
- Multer disk storage (uploads/videos)
- JWT auth

## Setup
1) Install deps: `npm install`
2) Copy env: `cp .env.example .env` and adjust.
3) Prisma: `npx prisma migrate dev` (after creating postgres from docker-compose).
4) Run dev: `npm run start:dev`
5) Docs available at `/v1/docs` (global API prefix is `/v1`).

## Important Paths
- Prisma schema: `prisma/schema.prisma`
- Modules: `src/auth`, `src/matches`, `src/worker`, `src/storage`, `src/cache`, `src/common`
- Upload root: `uploads/` (videos in `uploads/videos`)

## Matches Service (v1)
- Routes are prefixed with `/v1`.
- `GET /v1/matches` — list current user matches (tracking omitted).
- `GET /v1/matches/:id` — fetch a match including parsed `tracking` when available.
- `POST /v1/matches` (multipart) — upload original video (`file` required) plus optional metadata; enqueues a Redis job for processing and returns the created match with `status=UPLOADED`.
- `GET /v1/videos/:id` — stream processed video; 404 if not ready yet.
- Status lifecycle: `UPLOADED -> TRANSCODING -> READY -> ANALYZING -> DONE` (or `ERROR`).
- Tracking is stored as JSON; responses surface it under `tracking` when present.

## Worker Flow
- Backend enqueues `TRANSCODE_AND_ANALYZE` to Redis `jobs_queue`.
- Worker polls for jobs via long-poll `GET /v1/worker/jobs/next` (BLPOP jobs_queue ~20s timeout).  
  - Returns job JSON when available, `204 No Content` when idle.
- Worker fetches original video via `GET /v1/worker/matches/:id/original-video`.
- Worker posts results to `POST /v1/worker/complete` (status DONE or ERROR, tracking, errorMessage).  
  - For `DONE`, tracking is required and must include `court: {width, height}` and `timeline: [{t, b:{x,y}}]`.  
  - Processed video upload/setting is a separate step, not handled here.
- Restrict worker endpoints at the proxy (nginx `allow`/`deny` as in doc).

## Responses
- `/matches` and `/matches/:id` include `tracking` parsed from the stored JSON (`trackingJson` column) when available.
