import { Module } from '@nestjs/common';
import { GameFormatsService } from './game-formats.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameFormat } from './entities/game-format.entity';
import { GameFormatsController } from './game-formats.controller';

@Module({
  imports: [TypeOrmModule.forFeature([GameFormat])],
  providers: [GameFormatsService],
  exports: [GameFormatsService],
  controllers: [GameFormatsController],
})
export class GameFormatsModule {}
