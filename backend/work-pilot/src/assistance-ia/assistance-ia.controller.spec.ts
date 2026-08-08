import { Test, TestingModule } from '@nestjs/testing';
import { AssistanceIaController } from './assistance-ia.controller';

describe('AssistanceIaController', () => {
  let controller: AssistanceIaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssistanceIaController],
    }).compile();

    controller = module.get<AssistanceIaController>(AssistanceIaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
