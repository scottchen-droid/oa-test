import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { EmployeesModule } from './employees/employees.module';
import { AdminModule } from './admin/admin.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AttendanceModule } from './attendance/attendance.module';
import { LeavesModule } from './leaves/leaves.module';
import { OvertimeModule } from './overtime/overtime.module';
import { PayrollModule } from './payroll/payroll.module';
import { PerformanceModule } from './performance/performance.module';
import { PurchaseRequestsModule } from './purchase-requests/purchase-requests.module';
import { ReimbursementsModule } from './reimbursements/reimbursements.module';
import { ApprovalsModule } from './approvals/approvals.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { FormsModule } from './forms/forms.module';
import { FormDefinitionsModule } from './form-definitions/form-definitions.module';
import { ExchangeRatesModule } from './exchange-rates/exchange-rates.module';
import { ResourceItemsModule } from './resource-items/resource-items.module';
import { WorkOrderGroupsModule } from './work-order-groups/work-order-groups.module';
import { WorkOrderDispatchRulesModule } from './work-order-dispatch-rules/work-order-dispatch-rules.module';
import { WorkOrdersModule } from './work-orders/work-orders.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    RolesModule,
    OrganizationsModule,
    EmployeesModule,
    AdminModule,
    AnnouncementsModule,
    DashboardModule,
    AttendanceModule,
    LeavesModule,
    OvertimeModule,
    PayrollModule,
    PerformanceModule,
    PurchaseRequestsModule,
    ReimbursementsModule,
    ApprovalsModule,
    AuditLogsModule,
    FormsModule,
    FormDefinitionsModule,
    ExchangeRatesModule,
    ResourceItemsModule,
    WorkOrderGroupsModule,
    WorkOrderDispatchRulesModule,
    WorkOrdersModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
