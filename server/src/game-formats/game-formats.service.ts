import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameFormat } from 'src/game-formats/entities/game-format.entity';
import { UpdateGameFormatDTO } from './dto/update-game-format-dto';
import { CreateGameFormatDTO } from './dto/create-game-format-dto';

@Injectable()
export class GameFormatsService {
  constructor(
    @InjectRepository(GameFormat)
    private readonly gameFormatsRepository: Repository<GameFormat>,
  ) {}

  async create(createGameFormatDTO: CreateGameFormatDTO) {
    const gameFormat = await this.gameFormatsRepository.findOne({
      where: {
        time: createGameFormatDTO.time,
        increment: createGameFormatDTO.increment,
        additionalTime: createGameFormatDTO.additionalTime,
      },
    });

    if (gameFormat) {
      return gameFormat;
    }

    return this.gameFormatsRepository.save(createGameFormatDTO);
  }

  async update(id: string, updateGameFormatDTO: UpdateGameFormatDTO) {
    this.gameFormatsRepository.update(id, updateGameFormatDTO);
  }
}
