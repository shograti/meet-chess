import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { LogInDTO } from './dto/log-in-dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
  ) {}
  async logIn(logInDTO: LogInDTO): Promise<string> {
    const user = await this.userService.findOneByEmail(logInDTO);
    const passwordMatched = await bcrypt.compare(
      logInDTO.password,
      user.password,
    );
    if (!passwordMatched) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const accessToken = this.jwtService.sign({
      email: user.email,
      sub: user.id,
    });
    return accessToken;
  }
}
