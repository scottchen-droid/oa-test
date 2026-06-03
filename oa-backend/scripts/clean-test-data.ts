/**
 * clean-test-data.ts
 * 清除所有測試用的業務資料（組織架構、員工、薪資、表單等），
 * 只保留 00001 帳號及系統設定資料（權限、角色、假別、審批模板）。
 *
 * Usage: npm run db:reset
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 開始清除測試資料...\n');

  // ── 業務資料：由子往上刪 ──────────────────────────────────

  console.log('  刪除薪資成本分攤快照...');
  await prisma.payrollCostAllocationSnapshot.deleteMany();

  console.log('  刪除薪資紀錄...');
  await prisma.payrollRecord.deleteMany();

  console.log('  刪除薪資期別...');
  await prisma.payrollPeriod.deleteMany();

  console.log('  刪除薪資結構...');
  await prisma.salaryStructure.deleteMany();

  console.log('  刪除績效考核...');
  await prisma.performanceReview.deleteMany();
  await prisma.performanceGoal.deleteMany();
  await prisma.performanceCycle.deleteMany();

  console.log('  刪除假期餘額與申請...');
  await prisma.leaveBalance.deleteMany();
  await prisma.leaveRequest.deleteMany();

  console.log('  刪除加班申請...');
  await prisma.overtimeRequest.deleteMany();

  console.log('  刪除出勤紀錄...');
  await prisma.clockRecord.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.employeeWorkSchedule.deleteMany();

  console.log('  刪除電子表單...');
  await prisma.oaFormRequest.deleteMany();

  console.log('  刪除審批實例...');
  await prisma.approvalCcUser.deleteMany();
  await prisma.approvalAction.deleteMany();
  await prisma.approvalStepApprover.deleteMany();
  await prisma.approvalStep.deleteMany();
  await prisma.approvalInstance.deleteMany();

  console.log('  刪除採購/報銷...');
  await prisma.reimbursementItem.deleteMany();
  await prisma.reimbursementRequest.deleteMany();
  await prisma.purchaseRequestAllocation.deleteMany();
  await prisma.purchaseRequest.deleteMany();

  console.log('  刪除通知與附件...');
  await prisma.notification.deleteMany();
  await prisma.attachment.deleteMany();

  console.log('  刪除公告...');
  await prisma.announcementAttachment.deleteMany();
  await prisma.announcementTag.deleteMany();
  await prisma.announcement.deleteMany();

  console.log('  刪除稽核日誌...');
  await prisma.systemAuditLog.deleteMany();

  // ── 組織負責人與成本分攤 ────────────────────────────────────

  console.log('  刪除組織負責人...');
  await prisma.organizationLeader.deleteMany();

  console.log('  刪除員工成本分攤...');
  await prisma.employeeCostAllocation.deleteMany();

  console.log('  刪除員工組織歸屬...');
  await prisma.userOrgAssignment.deleteMany();

  // ── 員工帳號（保留 00001）──────────────────────────────────

  console.log('  刪除員工人事資料（保留 00001）...');
  const adminUser = await prisma.user.findFirst({ where: { employeeNo: '00001' } });
  const excludeId = adminUser?.id;

  await prisma.employeeProfile.deleteMany({
    where: excludeId ? { userId: { not: excludeId } } : {},
  });

  console.log('  刪除使用者角色（保留 00001）...');
  await prisma.userRole.deleteMany({
    where: excludeId ? { userId: { not: excludeId } } : {},
  });

  console.log('  刪除使用者帳號（保留 00001）...');
  await prisma.user.deleteMany({
    where: excludeId ? { id: { not: excludeId } } : {},
  });

  // ── 組織主檔 ───────────────────────────────────────────────

  console.log('  刪除部門...');
  await prisma.department.deleteMany();

  console.log('  刪除項目...');
  await prisma.project.deleteMany();

  console.log('  刪除事業部...');
  await prisma.businessUnit.deleteMany();

  console.log('  刪除職位...');
  await prisma.position.deleteMany();

  console.log('  刪除公司...');
  await prisma.company.deleteMany();

  console.log('  刪除地區...');
  await prisma.region.deleteMany();

  // ── 班別與國定假日 ─────────────────────────────────────────

  console.log('  刪除國定假日與班別...');
  await prisma.publicHoliday.deleteMany();
  await prisma.workScheduleRule.deleteMany();
  await prisma.workSchedule.deleteMany();

  console.log('\n✅ 測試資料清除完成。');
  console.log('   保留：permissions, roles, role_permissions, leave_types, job_levels, approval_templates, 00001 帳號');
  if (adminUser) {
    console.log(`   00001 帳號 ID: ${adminUser.id} / email: ${adminUser.email}`);
  }
}

main()
  .catch((e) => { console.error('❌ 清除失敗：', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
