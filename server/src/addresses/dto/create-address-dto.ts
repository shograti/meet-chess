import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAddressDTO {
  @IsNotEmpty()
  @IsString()
  street: string;

  @IsNotEmpty()
  @IsString()
  city: string;

  @IsNotEmpty()
  @IsString()
  zip: string;

  @IsNotEmpty()
  @IsString()
  country: string;
}
