-- CreateEnum
CREATE TYPE "discover"."AuthorType" AS ENUM ('Organization', 'User');

-- AlterTable
ALTER TABLE "discover"."DiscoverSkill" ADD COLUMN     "author_avatar_url" TEXT,
ADD COLUMN     "author_html_url" TEXT,
ADD COLUMN     "author_type" "discover"."AuthorType";
