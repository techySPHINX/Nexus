import { Test, TestingModule } from '@nestjs/testing';
import { EngagementService } from './engagement.service';

describe('EnagagementService', () => {
  let service: EngagementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EngagementService],
    }).compile();

    service = module.get<EngagementService>(EngagementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
