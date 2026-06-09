import { Module } from '@nestjs/common';
import { FormDefinitionsController, SystemFormDefinitionsController } from './form-definitions.controller';
import { FormDefinitionsService } from './form-definitions.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FormDefinitionsController, SystemFormDefinitionsController],
  providers: [FormDefinitionsService],
})
export class FormDefinitionsModule {}
