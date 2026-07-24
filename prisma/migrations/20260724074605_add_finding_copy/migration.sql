-- CreateTable
CREATE TABLE "FindingCopy" (
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedByUserId" TEXT,

    CONSTRAINT "FindingCopy_pkey" PRIMARY KEY ("code")
);

-- AddForeignKey
ALTER TABLE "FindingCopy" ADD CONSTRAINT "FindingCopy_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
