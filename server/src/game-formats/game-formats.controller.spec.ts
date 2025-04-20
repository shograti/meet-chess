import { Test, TestingModule } from '@nestjs/testing';
import { GameFormatsController } from './game-formats.controller';

describe('GameFormatsController', () => {
  let controller: GameFormatsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GameFormatsController],
    }).compile();

    controller = module.get<GameFormatsController>(GameFormatsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
