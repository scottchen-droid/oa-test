import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ResourceItemsController, ResourceItemsSystemController } from './resource-items.controller';
import { ResourceItemsService } from './resource-items.service';

@Module({
  imports: [PrismaModule],
  controllers: [ResourceItemsSystemController, ResourceItemsController],
  providers: [ResourceItemsService],
  exports: [ResourceItemsService],
})
export class ResourceItemsModule {}
