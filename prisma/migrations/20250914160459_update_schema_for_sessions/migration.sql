/*
  Warnings:

  - You are about to drop the column `timestamp` on the `chat_messages` table. All the data in the column will be lost.
  - You are about to drop the column `birthDate` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `birthPlace` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `birthTime` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `latitude` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `timezone` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `charts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `chat_sessions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `readings` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."charts" DROP CONSTRAINT "charts_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."chat_messages" DROP CONSTRAINT "chat_messages_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."chat_sessions" DROP CONSTRAINT "chat_sessions_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."readings" DROP CONSTRAINT "readings_userId_fkey";

-- DropIndex
DROP INDEX "public"."users_email_key";

-- AlterTable
ALTER TABLE "public"."chat_messages" DROP COLUMN "timestamp",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "lang" TEXT NOT NULL DEFAULT 'ne';

-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "birthDate",
DROP COLUMN "birthPlace",
DROP COLUMN "birthTime",
DROP COLUMN "email",
DROP COLUMN "latitude",
DROP COLUMN "longitude",
DROP COLUMN "timezone",
DROP COLUMN "updatedAt",
ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'ne',
ALTER COLUMN "name" DROP NOT NULL;

-- DropTable
DROP TABLE "public"."charts";

-- DropTable
DROP TABLE "public"."chat_sessions";

-- DropTable
DROP TABLE "public"."readings";

-- CreateTable
CREATE TABLE "public"."sessions" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."birth_inputs" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "name" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "rawDate" TEXT NOT NULL,
    "rawTime" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lon" DOUBLE PRECISION NOT NULL,
    "tzId" TEXT NOT NULL,
    "tzOffsetMinutes" INTEGER NOT NULL,

    CONSTRAINT "birth_inputs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."horoscope_results" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "summary" JSONB NOT NULL,

    CONSTRAINT "horoscope_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "birth_inputs_sessionId_key" ON "public"."birth_inputs"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "horoscope_results_sessionId_key" ON "public"."horoscope_results"("sessionId");

-- AddForeignKey
ALTER TABLE "public"."sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."birth_inputs" ADD CONSTRAINT "birth_inputs_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."horoscope_results" ADD CONSTRAINT "horoscope_results_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_messages" ADD CONSTRAINT "chat_messages_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
