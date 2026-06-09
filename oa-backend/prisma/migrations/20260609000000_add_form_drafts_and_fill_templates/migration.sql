-- CreateTable
CREATE TABLE "oa_form_drafts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "formType" VARCHAR(100) NOT NULL,
    "creatorUserId" UUID NOT NULL,
    "title" VARCHAR(255),
    "content" JSONB NOT NULL DEFAULT '{}',
    "lastSavedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oa_form_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oa_fill_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "formType" VARCHAR(100) NOT NULL,
    "creatorUserId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" VARCHAR(1000),
    "content" JSONB NOT NULL DEFAULT '{}',
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oa_fill_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "oa_form_drafts_creatorUserId_idx" ON "oa_form_drafts"("creatorUserId");

-- CreateIndex
CREATE INDEX "oa_fill_templates_creatorUserId_idx" ON "oa_fill_templates"("creatorUserId");

-- AddForeignKey
ALTER TABLE "oa_form_drafts" ADD CONSTRAINT "oa_form_drafts_creatorUserId_fkey" FOREIGN KEY ("creatorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oa_fill_templates" ADD CONSTRAINT "oa_fill_templates_creatorUserId_fkey" FOREIGN KEY ("creatorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
