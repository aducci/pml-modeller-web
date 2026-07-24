-- CreateTable
CREATE TABLE "PromptSkill" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "organizationId" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromptSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromptSkillVersion" (
    "id" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByUserId" TEXT,

    CONSTRAINT "PromptSkillVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PromptSkill_organizationId_idx" ON "PromptSkill"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "PromptSkill_key_organizationId_key" ON "PromptSkill"("key", "organizationId");

-- CreateIndex
CREATE INDEX "PromptSkillVersion_skillId_createdAt_idx" ON "PromptSkillVersion"("skillId", "createdAt");

-- AddForeignKey
ALTER TABLE "PromptSkill" ADD CONSTRAINT "PromptSkill_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromptSkillVersion" ADD CONSTRAINT "PromptSkillVersion_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "PromptSkill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromptSkillVersion" ADD CONSTRAINT "PromptSkillVersion_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
