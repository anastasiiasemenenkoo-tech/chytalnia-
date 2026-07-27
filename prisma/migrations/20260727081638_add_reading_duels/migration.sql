-- CreateEnum
CREATE TYPE "DuelStatus" AS ENUM ('PENDING', 'ACTIVE', 'FINISHED', 'DECLINED', 'CANCELLED');

-- CreateTable
CREATE TABLE "ReadingDuel" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "challengerId" TEXT NOT NULL,
    "opponentId" TEXT NOT NULL,
    "status" "DuelStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "winnerId" TEXT,
    "wonAt" TIMESTAMP(3),

    CONSTRAINT "ReadingDuel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReadingDuel_challengerId_status_idx" ON "ReadingDuel"("challengerId", "status");

-- CreateIndex
CREATE INDEX "ReadingDuel_opponentId_status_idx" ON "ReadingDuel"("opponentId", "status");

-- CreateIndex
CREATE INDEX "ReadingDuel_bookId_status_idx" ON "ReadingDuel"("bookId", "status");

-- AddForeignKey
ALTER TABLE "ReadingDuel" ADD CONSTRAINT "ReadingDuel_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "BookClub"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingDuel" ADD CONSTRAINT "ReadingDuel_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingDuel" ADD CONSTRAINT "ReadingDuel_challengerId_fkey" FOREIGN KEY ("challengerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingDuel" ADD CONSTRAINT "ReadingDuel_opponentId_fkey" FOREIGN KEY ("opponentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingDuel" ADD CONSTRAINT "ReadingDuel_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
