import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ReimbursementsController } from './reimbursements.controller';
import { ReimbursementsService } from './reimbursements.service';

@Module({
  imports: [PrismaModule],
  controllers: [ReimbursementsController],
  providers: [ReimbursementsService],
  exports: [ReimbursementsService],
})
export class ReimbursementsModule {}
