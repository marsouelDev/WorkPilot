import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { DatabaseModule } from '../database/database.module';
import { EmailModule } from '../email/email.module';
import { AiModule } from '../ai/ai.module';

@Module({
  providers: [TasksService],
  imports: [DatabaseModule, EmailModule, AiModule],
  controllers: [TasksController],
})
export class TasksModule {}
