import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameFormat } from 'src/game-formats/entities/game-format.entity';

@Injectable()
export class GameFormatsService {
  constructor(
    @InjectRepository(GameFormat)
    private readonly gameFormatsRepository: Repository<GameFormat>,
  ) {}
}
