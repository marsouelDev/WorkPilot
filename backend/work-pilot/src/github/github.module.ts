import { Global, Module } from '@nestjs/common';
import { GithubService } from './github.service';
import { DatabaseModule } from '../database/database.module';

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [GithubService],
  exports: [GithubService],
})
export class GithubModule {}
