import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WorkOrderDispatchRulesController } from './work-order-dispatch-rules.controller';
import { WorkOrderDispatchRulesService } from './work-order-dispatch-rules.service';

@Module({
  imports: [PrismaModule],
  controllers: [WorkOrderDispatchRulesController],
  providers: [WorkOrderDispatchRulesService],
  exports: [WorkOrderDispatchRulesService],
})
export class WorkOrderDispatchRulesModule {}
