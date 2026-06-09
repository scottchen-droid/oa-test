-- CreateTable
CREATE TABLE "oa_form_definitions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "formType" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "description" VARCHAR(500),
    "icon" VARCHAR(50),
    "iconColor" VARCHAR(20),
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "allowDraft" BOOLEAN NOT NULL DEFAULT true,
    "allowFillTemplate" BOOLEAN NOT NULL DEFAULT true,
    "allowCopyHistory" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oa_form_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oa_form_permissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "formDefinitionId" UUID NOT NULL,
    "targetType" VARCHAR(20) NOT NULL,
    "targetId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oa_form_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "oa_form_definitions_formType_key" ON "oa_form_definitions"("formType");

-- CreateIndex
CREATE INDEX "oa_form_permissions_formDefinitionId_idx" ON "oa_form_permissions"("formDefinitionId");

-- CreateIndex
CREATE UNIQUE INDEX "oa_form_permissions_formDefinitionId_targetType_targetId_key" ON "oa_form_permissions"("formDefinitionId", "targetType", "targetId");

-- AddForeignKey
ALTER TABLE "oa_form_permissions" ADD CONSTRAINT "oa_form_permissions_formDefinitionId_fkey" FOREIGN KEY ("formDefinitionId") REFERENCES "oa_form_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed: 8 form definitions + 8 'all' permissions

INSERT INTO "oa_form_definitions" ("id", "formType", "name", "category", "icon", "iconColor", "isEnabled", "allowDraft", "allowFillTemplate", "allowCopyHistory", "sortOrder", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), 'purchase_request',    '採購申請',     'finance',         'ShoppingCart', '#409eff', true, true, true, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'business_trip',       '出差申請',     'business',        'Suitcase',     '#1abc9c', true, true, true, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'expense_reimbursement','費用報銷申請', 'finance',         'Tickets',      '#e6a23c', true, true, true, true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'asset_request',       'OA資產申請單', 'administration',  'Briefcase',    '#3498db', true, true, true, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'meal_allowance',      '誤餐費申請',   'hr',              'Money',        '#67c23a', true, true, true, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'it_request',          '資訊需求申請', 'administration',  'Monitor',      '#e6a23c', true, true, true, true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'headcount_request',   '人力需求申請', 'hr',              'User',         '#9b59b6', true, true, true, true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'resignation',         '離職申請',     'hr',              'Remove',       '#f56c6c', true, true, true, true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "oa_form_permissions" ("id", "formDefinitionId", "targetType", "targetId", "createdAt")
SELECT gen_random_uuid(), d."id", 'all', NULL, CURRENT_TIMESTAMP
FROM "oa_form_definitions" d
WHERE d."formType" IN (
  'purchase_request', 'business_trip', 'expense_reimbursement',
  'asset_request', 'meal_allowance', 'it_request',
  'headcount_request', 'resignation'
);
