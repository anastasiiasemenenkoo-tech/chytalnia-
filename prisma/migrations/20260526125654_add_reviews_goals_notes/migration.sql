-- AlterTable
ALTER TABLE "User" ADD COLUMN "yearlyGoal" INTEGER;

-- AlterTable
ALTER TABLE "UserBook" ADD COLUMN "notes" TEXT;
ALTER TABLE "UserBook" ADD COLUMN "notesUpdatedAt" DATETIME;
ALTER TABLE "UserBook" ADD COLUMN "ratedAt" DATETIME;
ALTER TABLE "UserBook" ADD COLUMN "rating" INTEGER;
ALTER TABLE "UserBook" ADD COLUMN "review" TEXT;
ALTER TABLE "UserBook" ADD COLUMN "reviewUpdatedAt" DATETIME;
