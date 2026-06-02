-- DropForeignKey
ALTER TABLE "departments" DROP CONSTRAINT "departments_companyId_fkey";

-- DropIndex
DROP INDEX "departments_companyId_code_key";

-- AlterTable
ALTER TABLE "approval_template_step_approvers" ALTER COLUMN "approverType" SET DATA TYPE VARCHAR(100);

-- AlterTable
ALTER TABLE "approval_templates" ADD COLUMN     "approvalRouteType" VARCHAR(50) NOT NULL DEFAULT 'custom',
ADD COLUMN     "projectId" UUID,
ALTER COLUMN "formType" SET DATA TYPE VARCHAR(100);

-- AlterTable
ALTER TABLE "business_units" ADD COLUMN     "headUserId" UUID;

-- AlterTable
ALTER TABLE "departments" ADD COLUMN     "managerUserId" UUID,
ADD COLUMN     "projectId" UUID,
ALTER COLUMN "companyId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "oa_form_requests" ADD COLUMN     "businessUnitId" UUID,
ADD COLUMN     "companyId" UUID,
ADD COLUMN     "departmentId" UUID,
ADD COLUMN     "projectId" UUID,
ADD COLUMN     "regionId" UUID,
ADD COLUMN     "submittedAt" TIMESTAMP(3),
ALTER COLUMN "formType" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "status" SET DEFAULT 'draft';

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "projectOwnerUserId" UUID;

-- AlterTable
ALTER TABLE "user_org_assignments" ADD COLUMN     "assignmentType" VARCHAR(30) NOT NULL DEFAULT 'primary',
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "regionId" UUID;

-- CreateTable
CREATE TABLE "organization_leaders" (
    "id" UUID NOT NULL,
    "orgType" VARCHAR(50) NOT NULL,
    "orgId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "leaderType" VARCHAR(50) NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,
    "startedAt" DATE,
    "endedAt" DATE,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_leaders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_cost_allocations" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "regionId" UUID,
    "companyId" UUID,
    "businessUnitId" UUID,
    "projectId" UUID,
    "departmentId" UUID,
    "allocationPercent" DECIMAL(5,2) NOT NULL,
    "startedAt" DATE NOT NULL,
    "endedAt" DATE,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_cost_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_cost_allocation_snapshots" (
    "id" UUID NOT NULL,
    "payrollPeriodId" UUID NOT NULL,
    "payrollRecordId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "regionId" UUID,
    "companyId" UUID,
    "businessUnitId" UUID,
    "projectId" UUID,
    "departmentId" UUID,
    "allocationPercent" DECIMAL(5,2) NOT NULL,
    "allocatedAmount" DECIMAL(18,2) NOT NULL,
    "currencyCode" VARCHAR(10) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payroll_cost_allocation_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "organization_leaders_orgType_orgId_idx" ON "organization_leaders"("orgType", "orgId");

-- CreateIndex
CREATE INDEX "organization_leaders_userId_idx" ON "organization_leaders"("userId");

-- CreateIndex
CREATE INDEX "employee_cost_allocations_userId_startedAt_idx" ON "employee_cost_allocations"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "payroll_cost_allocation_snapshots_payrollPeriodId_userId_idx" ON "payroll_cost_allocation_snapshots"("payrollPeriodId", "userId");

-- CreateIndex
CREATE INDEX "payroll_cost_allocation_snapshots_projectId_idx" ON "payroll_cost_allocation_snapshots"("projectId");

-- CreateIndex
CREATE INDEX "oa_form_requests_businessUnitId_idx" ON "oa_form_requests"("businessUnitId");

-- CreateIndex
CREATE INDEX "oa_form_requests_projectId_idx" ON "oa_form_requests"("projectId");

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_managerUserId_fkey" FOREIGN KEY ("managerUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_units" ADD CONSTRAINT "business_units_headUserId_fkey" FOREIGN KEY ("headUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_projectOwnerUserId_fkey" FOREIGN KEY ("projectOwnerUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_org_assignments" ADD CONSTRAINT "user_org_assignments_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_templates" ADD CONSTRAINT "approval_templates_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_leaders" ADD CONSTRAINT "organization_leaders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_cost_allocations" ADD CONSTRAINT "employee_cost_allocations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_cost_allocations" ADD CONSTRAINT "employee_cost_allocations_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_cost_allocations" ADD CONSTRAINT "employee_cost_allocations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_cost_allocations" ADD CONSTRAINT "employee_cost_allocations_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "business_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_cost_allocations" ADD CONSTRAINT "employee_cost_allocations_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_cost_allocations" ADD CONSTRAINT "employee_cost_allocations_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_cost_allocation_snapshots" ADD CONSTRAINT "payroll_cost_allocation_snapshots_payrollPeriodId_fkey" FOREIGN KEY ("payrollPeriodId") REFERENCES "payroll_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_cost_allocation_snapshots" ADD CONSTRAINT "payroll_cost_allocation_snapshots_payrollRecordId_fkey" FOREIGN KEY ("payrollRecordId") REFERENCES "payroll_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_cost_allocation_snapshots" ADD CONSTRAINT "payroll_cost_allocation_snapshots_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_cost_allocation_snapshots" ADD CONSTRAINT "payroll_cost_allocation_snapshots_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_cost_allocation_snapshots" ADD CONSTRAINT "payroll_cost_allocation_snapshots_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_cost_allocation_snapshots" ADD CONSTRAINT "payroll_cost_allocation_snapshots_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "business_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_cost_allocation_snapshots" ADD CONSTRAINT "payroll_cost_allocation_snapshots_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_cost_allocation_snapshots" ADD CONSTRAINT "payroll_cost_allocation_snapshots_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oa_form_requests" ADD CONSTRAINT "oa_form_requests_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "business_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oa_form_requests" ADD CONSTRAINT "oa_form_requests_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oa_form_requests" ADD CONSTRAINT "oa_form_requests_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oa_form_requests" ADD CONSTRAINT "oa_form_requests_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oa_form_requests" ADD CONSTRAINT "oa_form_requests_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
