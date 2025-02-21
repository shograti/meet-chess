import { Module } from '@nestjs/common';
import { GameFormatsService } from './game-formats.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameFormat } from './entities/game-format.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GameFormat])],
  providers: [GameFormatsService],
  exports: [GameFormatsService],
})
export class GameFormatsModule {}
