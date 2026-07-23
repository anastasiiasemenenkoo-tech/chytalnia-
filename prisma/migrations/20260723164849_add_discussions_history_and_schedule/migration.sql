-- CreateTable
CREATE TABLE "ClubReadingHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clubId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "startDate" DATETIME,
    "dueDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    CONSTRAINT "ClubReadingHistory_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "BookClub" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClubReadingHistory_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClubComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clubId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "parentId" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClubComment_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "BookClub" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClubComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClubComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ClubComment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ClubReadingHistory_clubId_endedAt_idx" ON "ClubReadingHistory"("clubId", "endedAt");

-- CreateIndex
CREATE INDEX "ClubComment_clubId_createdAt_idx" ON "ClubComment"("clubId", "createdAt");
