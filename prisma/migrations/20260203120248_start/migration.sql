-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('UPLOADED', 'TRANSCODING', 'READY', 'ANALYZING', 'DONE', 'ERROR');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "title" TEXT,
    "player1Name" TEXT,
    "player2Name" TEXT,
    "eventDate" TIMESTAMP(3),
    "location" TEXT,
    "description" TEXT,
    "originalVideoUrl" TEXT NOT NULL,
    "processedVideoUrl" TEXT,
    "status" "MatchStatus" NOT NULL DEFAULT 'UPLOADED',
    "tracking" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
