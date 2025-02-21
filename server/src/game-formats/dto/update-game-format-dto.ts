import { PartialType } from '@nestjs/mapped-types';
import { CreateGameFormatDTO } from './create-game-format-dto';

export class UpdateGameFormatDTO extends PartialType(CreateGameFormatDTO) {}
