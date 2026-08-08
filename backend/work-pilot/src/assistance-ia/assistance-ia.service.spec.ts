import { Test, TestingModule } from '@nestjs/testing';
import { AssistanceIaService } from './assistance-ia.service';

describe('AssistanceIaService', () => {
  let service: AssistanceIaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AssistanceIaService],
    }).compile();

    service = module.get<AssistanceIaService>(AssistanceIaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
