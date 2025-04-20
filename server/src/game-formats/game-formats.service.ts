import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameFormat } from 'src/game-formats/entities/game-format.entity';
import { UpdateGameFormatDTO } from './dto/update-game-format-dto';
import { CreateGameFormatDTO } from './dto/create-game-format-dto';
import * as fs from 'fs';
import { getProjectRootPath } from 'src/utils/path.util';
import { v4 as uuidv4 } from 'uuid';

const timeControlsPath = getProjectRootPath(
  'src',
  'constants',
  'time-controls.json',
);
const unmatchedTimeControlsPath = getProjectRootPath(
  'src',
  'temp',
  'unmatched-time-controls.json',
);

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

  private readUnmatchedTimeControls(): string[] {
    if (!fs.existsSync(unmatchedTimeControlsPath)) {
      fs.mkdirSync(getProjectRootPath('server', 'src', 'temp'), {
        recursive: true,
      });
      fs.writeFileSync(unmatchedTimeControlsPath, '[]', 'utf-8');
    }

    const raw = fs.readFileSync(unmatchedTimeControlsPath, 'utf-8');
    return JSON.parse(raw);
  }

  private writeUnmatchedTimeControls(data: string[]) {
    fs.writeFileSync(
      unmatchedTimeControlsPath,
      JSON.stringify(data.sort(), null, 2),
      'utf8',
    );
  }

  private readTimeControls(): Record<string, any> {
    if (!fs.existsSync(timeControlsPath)) {
      fs.writeFileSync(timeControlsPath, '{}', 'utf-8');
    }

    const raw = fs.readFileSync(timeControlsPath, 'utf-8');
    return JSON.parse(raw);
  }

  private writeTimeControls(data: Record<string, any>) {
    fs.writeFileSync(timeControlsPath, JSON.stringify(data, null, 2), 'utf-8');
  }

  getUnmatchedTimeControls(): {
    id: string;
    raw: string;
    time: null;
    increment: null;
    additionalTime: null;
  }[] {
    const unmatched = this.readUnmatchedTimeControls();
    return unmatched.map((timing) => ({
      id: uuidv4(),
      raw: timing,
      time: null,
      increment: null,
      additionalTime: null,
    }));
  }

  reportUnmatchedTimeControl(timing: string) {
    const unmatched = this.readUnmatchedTimeControls();
    if (!unmatched.includes(timing)) {
      unmatched.push(timing);
      this.writeUnmatchedTimeControls(unmatched);
    }
  }

  addTimeControl(timing: string, mapping: any) {
    const controls = this.readTimeControls();
    controls[timing] = mapping;
    this.writeTimeControls(controls);

    let unmatched = this.readUnmatchedTimeControls();
    unmatched = unmatched.filter((t) => t !== timing);
    this.writeUnmatchedTimeControls(unmatched);
  }
}
