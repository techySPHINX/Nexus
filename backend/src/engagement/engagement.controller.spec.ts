import { Test, TestingModule } from '@nestjs/testing';
import { EngagementController } from './engagement.controller';

describe('EnagagementController', () => {
  let controller: EngagementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EngagementController],
    }).compile();

    controller = module.get<EngagementController>(EngagementController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
