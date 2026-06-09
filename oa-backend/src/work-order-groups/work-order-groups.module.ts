import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WorkOrderGroupsController, WorkOrderGroupsEmployeeController } from './work-order-groups.controller';
import { WorkOrderGroupsService } from './work-order-groups.service';

@Module({
  imports: [PrismaModule],
  controllers: [WorkOrderGroupsController, WorkOrderGroupsEmployeeController],
  providers: [WorkOrderGroupsService],
  exports: [WorkOrderGroupsService],
})
export class WorkOrderGroupsModule {}
