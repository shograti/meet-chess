import { Test, TestingModule } from '@nestjs/testing';
import { GameFormatsService } from './game-formats.service';

describe('GameFormatsService', () => {
  let service: GameFormatsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GameFormatsService],
    }).compile();

    service = module.get<GameFormatsService>(GameFormatsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
