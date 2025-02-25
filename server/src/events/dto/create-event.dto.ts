import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PairingSystem } from '../entities/event.entity';
import { CreateAddressDTO } from 'src/addresses/dto/create-address-dto';
import { CreateGameFormatDTO } from 'src/game-formats/dto/create-game-format-dto';

export class CreateEventDTO {
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(50)
  @IsString()
  name: string;

  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(300)
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  beginsAt: Date;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  endsAt: Date;

  @IsOptional()
  @IsNumber()
  cashprize?: number;

  @IsOptional()
  @IsNumber()
  rounds?: number;

  @IsOptional()
  @IsEnum(PairingSystem)
  pairingSystem?: PairingSystem;

  @ValidateNested()
  @Type(() => CreateAddressDTO)
  address: CreateAddressDTO;

  @IsOptional()
  @Type(() => CreateGameFormatDTO)
  gameFormat?: CreateGameFormatDTO;

  creatorUsername: string;
}
