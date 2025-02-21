import { IsNumber, IsOptional } from 'class-validator';

export class CreateGameFormatDTO {
  @IsOptional()
  @IsNumber()
  increment?: number;

  @IsOptional()
  @IsNumber()
  additionalTime?: number;

  @IsOptional()
  time?: Date;
}
