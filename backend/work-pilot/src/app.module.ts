import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
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
import { AssistanceIaModule } from './assistance-ia/assistance-ia.module';
import { NotificationModule } from './notification/notification.module';
import { CryptoModule } from './crypto/crypto.module';
import { CryptoService } from './crypto/crypto.service';
import { GithubModule } from './github/github.module';
import { GithubService } from './github/github.service';
import { PullRequestsModule } from './pull-requests/pull-requests.module';
import { LivrableFinalService } from './livrable-final/livrable-final.service';
import { LivrableFinalModule } from './livrable-final/livrable-final.module';
import { UploadService } from './upload/upload.service';
import { UploadModule } from './upload/upload.module';
import { DashboardModule } from './dashboard/dashboard.module';

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
    NotificationModule,
    CryptoModule,
    GithubModule,
    PullRequestsModule,
    LivrableFinalModule,
    UploadModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    CryptoService,
    GithubService,
    LivrableFinalService,
    UploadService,
  ],
})
export class AppModule {}
