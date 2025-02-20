import { Module } from '@nestjs/common';
import { GameFormatsService } from './game-formats.service';

@Module({
  providers: [GameFormatsService]
})
export class GameFormatsModule {}
