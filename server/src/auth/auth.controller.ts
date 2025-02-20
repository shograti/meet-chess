import { Body, Controller, Post } from '@nestjs/common';
import { SignUpDTO } from './dto/sign-up-dto';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private usersService: UsersService) {}
  @Post('/sign-up')
  async create(@Body() signUpDTO: SignUpDTO): Promise<Partial<User>> {
    return this.usersService.create(signUpDTO);
  }
}
