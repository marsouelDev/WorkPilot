import { Module } from '@nestjs/common';
import { LivrableFinalController } from './livrable-final.controller';
import { DatabaseModule } from '../database/database.module';
import { NotificationModule } from '../notification/notification.module';
import { LivrableFinalService } from './livrable-final.service';

@Module({
  imports: [DatabaseModule, NotificationModule],
  controllers: [LivrableFinalController],
  providers: [LivrableFinalService],
  exports: [LivrableFinalService],
})
export class LivrableFinalModule {}
