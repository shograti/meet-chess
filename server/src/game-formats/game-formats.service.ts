import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameFormat } from 'src/game-formats/entities/game-format.entity';
import { UpdateGameFormatDTO } from './dto/update-game-format-dto';

@Injectable()
export class GameFormatsService {
  constructor(
    @InjectRepository(GameFormat)
    private readonly gameFormatsRepository: Repository<GameFormat>,
  ) {}

  async update(id: string, updateGameFormatDTO: UpdateGameFormatDTO) {
    this.gameFormatsRepository.update(id, updateGameFormatDTO);
  }
}
