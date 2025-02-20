import { IsEmail, IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class SignUpDTO {
  @IsNotEmpty()
  @IsEmail()
  email: string;
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(20)
  username: string;
  @MinLength(8)
  @MaxLength(20)
  @IsNotEmpty()
  password: string;
}
