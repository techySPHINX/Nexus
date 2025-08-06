import { Test, TestingModule } from '@nestjs/testing';
import { EnagagementController } from './enagagement.controller';

describe('EnagagementController', () => {
  let controller: EnagagementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EnagagementController],
    }).compile();

    controller = module.get<EnagagementController>(EnagagementController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
