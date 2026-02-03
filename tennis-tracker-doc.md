# 🎾 Tennis Tracker — Backend Documentation (Full Unified Document)

## 1. Overview

Tennis Tracker — сервис загрузки видео теннисных матчей с их последующей обработкой: AI‑трекинг мяча, игроков, визуализация траектории и построение мини-карты.  
Видео обрабатывает внешний **Python worker**, который получает job из Redis, скачивает оригинальное видео, выполняет компрессию + AI, отправляет результаты обратно.

Backend - **NestJS + PostgreSQL + Prisma**, Storage - локальный диск (позже S3/MinIO).  
Global API prefix: **/v1** (all routes below include it).

---

## 2. System Architecture

```
Frontend (React)
      |
HTTPS REST
      |
Nginx (VDS) — фильтрует /worker/* по IP
      |
Backend NestJS
 |    |    |
Postgres  Redis (jobs_queue)  Local Storage
      |
Python Worker (дом/офис)
 - BLPOP jobs_queue
 - GET /worker/matches/:id/original-video
 - ffmpeg + AI
 - POST /worker/complete
```

---

## 3. Technologies & NPM Packages

### Backend

- NestJS
- Prisma ORM
- PostgreSQL
- Redis (ioredis)
- Multer (file uploads)
- JWT auth (passport-jwt)
- class-validator, class-transformer
- @nestjs/swagger (OpenAPI)

Swagger UI: `/v1/docs` (secured with bearer auth).

---

## 4. Docker Setup

### docker-compose.yml

```
version: "3.9"

services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: tennis
      POSTGRES_PASSWORD: tennispass
      POSTGRES_DB: tennis_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Dockerfile

```
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/uploads ./uploads
CMD ["node", "dist/main.js"]
```

---

## 5. Database Schema (Prisma)

```
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String
  createdAt DateTime @default(now())
  matches   Match[]
}

model Match {
  id               Int          @id @default(autoincrement())
  user             User         @relation(fields: [userId], references: [id])
  userId           Int

  title            String?
  player1Name      String?
  player2Name      String?
  eventDate        DateTime?
  location         String?
  description      String?

  originalVideoUrl String
  processedVideoUrl String?
  status           MatchStatus  @default(UPLOADED)

  trackingJson     Json?
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt
}

enum MatchStatus {
  UPLOADED
  TRANSCODING
  READY
  ANALYZING
  DONE
  ERROR
}
```

---

## 6. Redis Queue Specification

Queue name: **jobs_queue**

Job payload:

```
{
  "type": "TRANSCODE_AND_ANALYZE",
  "matchId": 12,
  "createdAt": 1714500000
}
```

Backend → RPUSH  
Worker → BLPOP

---

## 7. Tracking Format (AI Output)

```
TrackingData = {
  meta: {
    matchId: string
    framerate: number
    court: { width, height }
    players: { p1, p2 }
  },
  timeline: [
    {
      t: number,
      b: { x, y, s?, v, evt? },
      p1: { x, y, v },
      p2: { x, y, v }
    }, ...
  ]
}
```

---

## 8. API Specification (REST)

### Auth

#### POST /auth/register
Body:
```
{ "email": "...", "password": "..." }
```

#### POST /auth/login
Returns JWT.

---

### Matches (JWT required, prefixed with `/v1`)

#### GET /v1/matches
List matches for current user (tracking omitted for list).

#### GET /v1/matches/:id
Returns match with parsed `tracking` when available; 404 if not found.

#### POST /v1/matches (multipart)
Fields:
- file (required)
- title
- player1Name
- player2Name
- eventDate
- location
- description

On success: creates match with `status=UPLOADED`, stores original video path, enqueues Redis job `TRANSCODE_AND_ANALYZE`.
Error cases: 400 when `file` missing; 401 for auth failures.

---

### Videos (JWT required)

#### GET /v1/videos/:id  
Returns processed video stream; 404 if processedVideoUrl is not set yet.

---

### Worker API (restricted by nginx IP, prefixed with `/v1`)

#### GET /v1/worker/matches/:id/original-video  
Stream original video.

#### GET /v1/worker/jobs/next  
Long-poll BLPOP; returns job JSON or 204 when queue is empty.

#### POST /v1/worker/complete  
Worker submits results:

```
{
  matchId,
  status: "DONE" | "ERROR",
  processedVideoUrl?,
  tracking?,
  errorMessage?
}
```

---

## 9. Folder Structure

```
src/
  auth/
  matches/
  worker/
  storage/
  cache/
  prisma/
  common/
uploads/videos
```

---

## 10. Python Worker Flow

1. BLPOP jobs_queue  
2. Download original video via GET /worker/...  
3. ffmpeg compress (later)  
4. AI tracking  
5. POST /worker/complete  

---

## 11. Nginx Config

```
location /worker/ {
    allow YOUR_WORKER_IP;
    deny all;
    proxy_pass http://127.0.0.1:3000;
}
location / {
    proxy_pass http://127.0.0.1:3000;
}
```

---

## 12. Match Lifecycle

```
UPLOADED → TRANSCODING → READY → ANALYZING → DONE
                      → ERROR
```

---

# 13. Updated Worker Long-Poll Flow (Dec 2025)

- Backend enqueues jobs to `jobs_queue` (`RPUSH`).
- Worker polls backend via **GET /v1/worker/jobs/next**; backend does `BLPOP jobs_queue` with ~20-30s timeout.  
  - If a job exists: returns job JSON.  
  - If queue empty: returns `204 No Content`.
- Worker downloads source video: **GET /v1/worker/matches/:id/original-video**.
- Worker processes video/AI tracking.
- Worker reports result: **POST /v1/worker/complete** with `{ matchId, status: "DONE"|"ERROR", tracking?, errorMessage? }` (no processed video upload in this step).  
  - For `status="DONE"`, `tracking` is required and must include `court { width, height }` and `timeline` entries `{ t, b:{x,y} }`.
- Redis remains internal; HTTP is the worker interface. Processed video upload/setting is a separate step if needed.

# END OF DOCUMENT
