import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { MailModule } from './mail/mail.module';
import { EmailModule } from './email/email.module';
import { AiModule } from './ai/ai.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AssistanceIaModule } from './assistance-ia/assistance-ia.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    DatabaseModule,
    UsersModule,
    MailModule,
    EmailModule,
    AiModule,
    ProjectsModule,
    TasksModule,
    AssistanceIaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
