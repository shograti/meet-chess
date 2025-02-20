import { Body, Controller, Post, Res } from '@nestjs/common';
import { Response } from 'express'; // Import Response from express
import { SignUpDTO } from './dto/sign-up-dto';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/entities/user.entity';
import { AuthService } from './auth.service';
import { LogInDTO } from './dto/log-in-dto';

@Controller('auth')
export class AuthController {
  constructor(
    private usersService: UsersService,
    private authService: AuthService,
  ) {}

  @Post('/sign-up')
  async create(@Body() signUpDTO: SignUpDTO): Promise<Partial<User>> {
    return this.usersService.create(signUpDTO);
  }

  @Post('log-in')
  async logIn(@Body() logInDTO: LogInDTO, @Res() res: Response) {
    const accessToken = await this.authService.logIn(logInDTO);

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000 * 24,
    });

    return res.json({ message: 'Logged in successfully' });
  }

  @Post('logout')
  async logout(@Res() res: Response) {
    res.clearCookie('access_token');
    return res.json({ message: 'Logged out successfully' });
  }
}
