import { Module } from '@nestjs/common';
import { AssistanceIaService } from './assistance-ia.service';
import { AssistanceIaController } from './assistance-ia.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [AssistanceIaService],
  controllers: [AssistanceIaController],
  exports: [AssistanceIaService],
})
export class AssistanceIaModule {}
