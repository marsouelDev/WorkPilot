import { Test, TestingModule } from '@nestjs/testing';
import { LivrableFinalService } from './livrable-final.service';

describe('LivrableFinalService', () => {
  let service: LivrableFinalService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LivrableFinalService],
    }).compile();

    service = module.get<LivrableFinalService>(LivrableFinalService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
