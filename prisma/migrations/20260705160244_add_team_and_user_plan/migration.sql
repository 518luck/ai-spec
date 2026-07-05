/*
  Warnings:

  - A unique constraint covering the columns `[hashed_key]` on the table `Token` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "auth"."UserPlan" AS ENUM ('free', 'pro');

-- CreateEnum
CREATE TYPE "auth"."TeamPlan" AS ENUM ('free', 'team', 'enterprise');

-- CreateEnum
CREATE TYPE "auth"."TeamRole" AS ENUM ('owner', 'admin', 'member', 'viewer');

-- AlterTable
ALTER TABLE "auth"."User" ADD COLUMN     "plan" "auth"."UserPlan" NOT NULL DEFAULT 'free';

-- CreateTable
CREATE TABLE "auth"."Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "description" TEXT,
    "plan" "auth"."TeamPlan" NOT NULL DEFAULT 'free',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."TeamMember" (
    "id" TEXT NOT NULL,
    "role" "auth"."TeamRole" NOT NULL DEFAULT 'member',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "team_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Team_slug_key" ON "auth"."Team"("slug");

-- CreateIndex
CREATE INDEX "TeamMember_user_id_idx" ON "auth"."TeamMember"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_team_id_user_id_key" ON "auth"."TeamMember"("team_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Token_hashed_key_key" ON "token"."Token"("hashed_key");

-- AddForeignKey
ALTER TABLE "auth"."TeamMember" ADD CONSTRAINT "TeamMember_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "auth"."Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."TeamMember" ADD CONSTRAINT "TeamMember_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
