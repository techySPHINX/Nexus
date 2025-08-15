import { Test, TestingModule } from '@nestjs/testing';
import { ShowcaseService } from './showcase.service';

describe('ShowcaseService', () => {
  let service: ShowcaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ShowcaseService],
    }).compile();

    service = module.get<ShowcaseService>(ShowcaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
