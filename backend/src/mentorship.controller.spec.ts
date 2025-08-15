import { Test, TestingModule } from '@nestjs/testing';
import { MentorshipController } from './mentorship.controller';

describe('MentorshipController', () => {
  let controller: MentorshipController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MentorshipController],
    }).compile();

    controller = module.get<MentorshipController>(MentorshipController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
