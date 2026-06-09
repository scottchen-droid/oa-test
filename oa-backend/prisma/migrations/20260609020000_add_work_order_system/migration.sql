-- ═══════════════════════════════════════════════
-- Migration: add_work_order_system
-- 新增人員資源申請單與工作單中心
-- ═══════════════════════════════════════════════

-- 1. CREATE TABLE resource_items
CREATE TABLE "resource_items" (
    "id"                  UUID         NOT NULL DEFAULT gen_random_uuid(),
    "code"                VARCHAR(50)  NOT NULL,
    "name"                VARCHAR(100) NOT NULL,
    "category"            VARCHAR(30)  NOT NULL,
    "responsibleUnit"     VARCHAR(100),
    "availableOnOnboard"  BOOLEAN      NOT NULL DEFAULT true,
    "requiredOnOffboard"  BOOLEAN      NOT NULL DEFAULT false,
    "availableOnAdd"      BOOLEAN      NOT NULL DEFAULT true,
    "availableOnChange"   BOOLEAN      NOT NULL DEFAULT false,
    "requiresAccountFill" BOOLEAN      NOT NULL DEFAULT false,
    "requiresAttachment"  BOOLEAN      NOT NULL DEFAULT false,
    "isEnabled"           BOOLEAN      NOT NULL DEFAULT true,
    "sortOrder"           INTEGER      NOT NULL DEFAULT 0,
    "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"           TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resource_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "resource_items_code_key" ON "resource_items"("code");

-- 2. CREATE TABLE work_order_groups
CREATE TABLE "work_order_groups" (
    "id"          UUID         NOT NULL DEFAULT gen_random_uuid(),
    "name"        VARCHAR(100) NOT NULL,
    "description" VARCHAR(300),
    "isEnabled"   BOOLEAN      NOT NULL DEFAULT true,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_order_groups_pkey" PRIMARY KEY ("id")
);

-- 3. CREATE TABLE work_order_group_members
CREATE TABLE "work_order_group_members" (
    "id"       UUID         NOT NULL DEFAULT gen_random_uuid(),
    "groupId"  UUID         NOT NULL,
    "userId"   UUID         NOT NULL,
    "isLeader" BOOLEAN      NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_order_group_members_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "work_order_group_members_groupId_userId_key" ON "work_order_group_members"("groupId", "userId");
CREATE INDEX "work_order_group_members_userId_idx" ON "work_order_group_members"("userId");

-- 4. CREATE TABLE work_order_dispatch_rules
CREATE TABLE "work_order_dispatch_rules" (
    "id"               UUID         NOT NULL DEFAULT gen_random_uuid(),
    "resourceItemId"   UUID         NOT NULL,
    "workOrderGroupId" UUID         NOT NULL,
    "regionId"         UUID,
    "companyId"        UUID,
    "departmentId"     UUID,
    "businessUnitId"   UUID,
    "projectId"        UUID,
    "priority"         INTEGER      NOT NULL DEFAULT 0,
    "isEnabled"        BOOLEAN      NOT NULL DEFAULT true,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_order_dispatch_rules_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "work_order_dispatch_rules_resourceItemId_idx" ON "work_order_dispatch_rules"("resourceItemId");

-- 5. CREATE TABLE personnel_resource_requests
CREATE TABLE "personnel_resource_requests" (
    "id"            UUID         NOT NULL DEFAULT gen_random_uuid(),
    "formRequestId" UUID         NOT NULL,
    "requestType"   VARCHAR(30)  NOT NULL,
    "targetUserId"  UUID         NOT NULL,
    "effectiveDate" DATE         NOT NULL,
    "reason"        VARCHAR(500),
    "remark"        VARCHAR(500),
    "status"        VARCHAR(30)  NOT NULL DEFAULT 'draft',
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personnel_resource_requests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "personnel_resource_requests_formRequestId_key" ON "personnel_resource_requests"("formRequestId");
CREATE INDEX "personnel_resource_requests_targetUserId_idx" ON "personnel_resource_requests"("targetUserId");
CREATE INDEX "personnel_resource_requests_status_idx" ON "personnel_resource_requests"("status");

-- 6. CREATE TABLE personnel_resource_request_items
CREATE TABLE "personnel_resource_request_items" (
    "id"             UUID         NOT NULL DEFAULT gen_random_uuid(),
    "requestId"      UUID         NOT NULL,
    "resourceItemId" UUID         NOT NULL,
    "existingValue"  VARCHAR(200),
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "personnel_resource_request_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "personnel_resource_request_items_requestId_resourceItemId_key" ON "personnel_resource_request_items"("requestId", "resourceItemId");
CREATE INDEX "personnel_resource_request_items_requestId_idx" ON "personnel_resource_request_items"("requestId");

-- 7. CREATE TABLE work_orders
CREATE TABLE "work_orders" (
    "id"               UUID         NOT NULL DEFAULT gen_random_uuid(),
    "requestId"        UUID         NOT NULL,
    "requestItemId"    UUID         NOT NULL,
    "resourceItemId"   UUID         NOT NULL,
    "workOrderGroupId" UUID,
    "assignedUserId"   UUID,
    "status"           VARCHAR(30)  NOT NULL DEFAULT 'pending_dispatch',
    "dispatchErrorMsg" VARCHAR(500),
    "resultData"       JSONB,
    "completedAt"      TIMESTAMP(3),
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_orders_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "work_orders_requestItemId_key" ON "work_orders"("requestItemId");
CREATE INDEX "work_orders_requestId_idx" ON "work_orders"("requestId");
CREATE INDEX "work_orders_workOrderGroupId_idx" ON "work_orders"("workOrderGroupId");
CREATE INDEX "work_orders_status_idx" ON "work_orders"("status");

-- 8. CREATE TABLE work_order_histories
CREATE TABLE "work_order_histories" (
    "id"             UUID         NOT NULL DEFAULT gen_random_uuid(),
    "workOrderId"    UUID         NOT NULL,
    "operatorUserId" UUID         NOT NULL,
    "action"         VARCHAR(50)  NOT NULL,
    "fromStatus"     VARCHAR(30),
    "toStatus"       VARCHAR(30),
    "fromGroupId"    UUID,
    "toGroupId"      UUID,
    "content"        VARCHAR(500),
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_order_histories_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "work_order_histories_workOrderId_idx" ON "work_order_histories"("workOrderId");

-- 9. CREATE TABLE employee_resources
CREATE TABLE "employee_resources" (
    "id"             UUID         NOT NULL DEFAULT gen_random_uuid(),
    "userId"         UUID         NOT NULL,
    "resourceItemId" UUID         NOT NULL,
    "value"          VARCHAR(200),
    "extraData"      JSONB,
    "isActive"       BOOLEAN      NOT NULL DEFAULT true,
    "workOrderId"    UUID,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_resources_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "employee_resources_userId_resourceItemId_key" ON "employee_resources"("userId", "resourceItemId");
CREATE INDEX "employee_resources_userId_idx" ON "employee_resources"("userId");

-- ═══════════════════════════════════════════════
-- FK 約束
-- ═══════════════════════════════════════════════

-- work_order_group_members → work_order_groups, users
ALTER TABLE "work_order_group_members"
    ADD CONSTRAINT "work_order_group_members_groupId_fkey"
        FOREIGN KEY ("groupId") REFERENCES "work_order_groups"("id") ON DELETE CASCADE,
    ADD CONSTRAINT "work_order_group_members_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;

-- work_order_dispatch_rules → resource_items, work_order_groups, regions, companies, departments, business_units, projects
ALTER TABLE "work_order_dispatch_rules"
    ADD CONSTRAINT "work_order_dispatch_rules_resourceItemId_fkey"
        FOREIGN KEY ("resourceItemId") REFERENCES "resource_items"("id"),
    ADD CONSTRAINT "work_order_dispatch_rules_workOrderGroupId_fkey"
        FOREIGN KEY ("workOrderGroupId") REFERENCES "work_order_groups"("id"),
    ADD CONSTRAINT "work_order_dispatch_rules_regionId_fkey"
        FOREIGN KEY ("regionId") REFERENCES "regions"("id"),
    ADD CONSTRAINT "work_order_dispatch_rules_companyId_fkey"
        FOREIGN KEY ("companyId") REFERENCES "companies"("id"),
    ADD CONSTRAINT "work_order_dispatch_rules_departmentId_fkey"
        FOREIGN KEY ("departmentId") REFERENCES "departments"("id"),
    ADD CONSTRAINT "work_order_dispatch_rules_businessUnitId_fkey"
        FOREIGN KEY ("businessUnitId") REFERENCES "business_units"("id"),
    ADD CONSTRAINT "work_order_dispatch_rules_projectId_fkey"
        FOREIGN KEY ("projectId") REFERENCES "projects"("id");

-- personnel_resource_requests → oa_form_requests, users
ALTER TABLE "personnel_resource_requests"
    ADD CONSTRAINT "personnel_resource_requests_formRequestId_fkey"
        FOREIGN KEY ("formRequestId") REFERENCES "oa_form_requests"("id"),
    ADD CONSTRAINT "personnel_resource_requests_targetUserId_fkey"
        FOREIGN KEY ("targetUserId") REFERENCES "users"("id");

-- personnel_resource_request_items → personnel_resource_requests, resource_items
ALTER TABLE "personnel_resource_request_items"
    ADD CONSTRAINT "personnel_resource_request_items_requestId_fkey"
        FOREIGN KEY ("requestId") REFERENCES "personnel_resource_requests"("id") ON DELETE CASCADE,
    ADD CONSTRAINT "personnel_resource_request_items_resourceItemId_fkey"
        FOREIGN KEY ("resourceItemId") REFERENCES "resource_items"("id");

-- work_orders → personnel_resource_requests, personnel_resource_request_items, resource_items, work_order_groups, users
ALTER TABLE "work_orders"
    ADD CONSTRAINT "work_orders_requestId_fkey"
        FOREIGN KEY ("requestId") REFERENCES "personnel_resource_requests"("id"),
    ADD CONSTRAINT "work_orders_requestItemId_fkey"
        FOREIGN KEY ("requestItemId") REFERENCES "personnel_resource_request_items"("id"),
    ADD CONSTRAINT "work_orders_resourceItemId_fkey"
        FOREIGN KEY ("resourceItemId") REFERENCES "resource_items"("id"),
    ADD CONSTRAINT "work_orders_workOrderGroupId_fkey"
        FOREIGN KEY ("workOrderGroupId") REFERENCES "work_order_groups"("id"),
    ADD CONSTRAINT "work_orders_assignedUserId_fkey"
        FOREIGN KEY ("assignedUserId") REFERENCES "users"("id");

-- work_order_histories → work_orders, users
ALTER TABLE "work_order_histories"
    ADD CONSTRAINT "work_order_histories_workOrderId_fkey"
        FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE CASCADE,
    ADD CONSTRAINT "work_order_histories_operatorUserId_fkey"
        FOREIGN KEY ("operatorUserId") REFERENCES "users"("id");

-- employee_resources → users, resource_items
ALTER TABLE "employee_resources"
    ADD CONSTRAINT "employee_resources_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "users"("id"),
    ADD CONSTRAINT "employee_resources_resourceItemId_fkey"
        FOREIGN KEY ("resourceItemId") REFERENCES "resource_items"("id");

-- ═══════════════════════════════════════════════
-- Seed 資料：resource_items 初始 8 筆
-- ═══════════════════════════════════════════════

INSERT INTO "resource_items" (
    "id", "code", "name", "category", "responsibleUnit",
    "availableOnOnboard", "requiredOnOffboard", "availableOnAdd", "availableOnChange",
    "requiresAccountFill", "requiresAttachment", "isEnabled", "sortOrder",
    "createdAt", "updatedAt"
) VALUES
(gen_random_uuid(), 'mattermost',       'Mattermost 帳號',   'account',  'IT',
 true,  true,  true,  false, true,  false, true, 1, NOW(), NOW()),
(gen_random_uuid(), 'jira',             'Jira 帳號',          'account',  'PMO/IT',
 true,  true,  true,  false, true,  false, true, 2, NOW(), NOW()),
(gen_random_uuid(), 'access_card',      '門禁卡',             'physical', '行政',
 true,  true,  false, true,  true,  false, true, 3, NOW(), NOW()),
(gen_random_uuid(), 'fingerprint',      '指紋設定',           'physical', '行政/HR',
 true,  true,  false, false, false, false, true, 4, NOW(), NOW()),
(gen_random_uuid(), 'phone_ext',        '電話分機',           'physical', '行政/總務',
 true,  true,  false, false, true,  false, true, 5, NOW(), NOW()),
(gen_random_uuid(), 'apple_id',         'Apple ID',           'account',  'IT/資產',
 true,  true,  true,  false, true,  false, true, 6, NOW(), NOW()),
(gen_random_uuid(), 'vpn',              'VPN 帳號',           'account',  'IT',
 false, true,  true,  false, true,  false, true, 7, NOW(), NOW()),
(gen_random_uuid(), 'google_workspace', 'Google Workspace',   'account',  'IT',
 true,  true,  true,  false, true,  false, true, 8, NOW(), NOW());

-- ═══════════════════════════════════════════════
-- Seed 資料：oa_form_definitions 新增人員資源申請單
-- ═══════════════════════════════════════════════

INSERT INTO "oa_form_definitions" (
    "id", "formType", "name", "category", "description",
    "icon", "iconColor", "isEnabled", "allowDraft", "allowFillTemplate", "allowCopyHistory",
    "sortOrder", "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid(),
    'personnel_resource_request',
    '人員資源申請單',
    'hr',
    '用於入職/離職/在職新增或變更人員所需的各類資源，如帳號、門禁卡等',
    'User',
    '#409EFF',
    true,
    true,
    true,
    true,
    10,
    NOW(),
    NOW()
) ON CONFLICT ("formType") DO NOTHING;

-- oa_form_permissions：all 權限
INSERT INTO "oa_form_permissions" (
    "id", "formDefinitionId", "targetType", "targetId", "createdAt"
)
SELECT
    gen_random_uuid(),
    d."id",
    'all',
    NULL,
    NOW()
FROM "oa_form_definitions" d
WHERE d."formType" = 'personnel_resource_request'
ON CONFLICT ("formDefinitionId", "targetType", "targetId") DO NOTHING;
