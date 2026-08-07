import { Test, TestingModule } from '@nestjs/testing';
import { BrevoService } from './brevo.service';

describe('BrevoService', () => {
  let service: BrevoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BrevoService],
    }).compile();

    service = module.get<BrevoService>(BrevoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
