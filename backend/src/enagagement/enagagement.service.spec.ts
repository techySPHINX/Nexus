import { Test, TestingModule } from '@nestjs/testing';
import { EnagagementService } from './enagagement.service';

describe('EnagagementService', () => {
  let service: EnagagementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EnagagementService],
    }).compile();

    service = module.get<EnagagementService>(EnagagementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
