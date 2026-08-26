import { Test, TestingModule } from '@nestjs/testing';
import { LivrableFinalController } from './livrable-final.controller';

describe('LivrableFinalController', () => {
  let controller: LivrableFinalController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LivrableFinalController],
    }).compile();

    controller = module.get<LivrableFinalController>(LivrableFinalController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
