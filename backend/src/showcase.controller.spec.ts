import { Test, TestingModule } from '@nestjs/testing';
import { ShowcaseController } from './showcase.controller';

describe('ShowcaseController', () => {
  let controller: ShowcaseController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShowcaseController],
    }).compile();

    controller = module.get<ShowcaseController>(ShowcaseController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
