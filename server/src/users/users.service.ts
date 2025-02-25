import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { SignUpDTO } from 'src/auth/dto/sign-up-dto';
import { LogInDTO } from 'src/auth/dto/log-in-dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
  ) {}

  async create(signUpDTO: SignUpDTO): Promise<Partial<User>> {
    const usernameAlreadyExists = await this.usersRepository.findOne({
      where: {
        username: signUpDTO.username,
      },
    });
    const emailAlreadyExists = await this.usersRepository.findOne({
      where: {
        email: signUpDTO.email,
      },
    });

    if (usernameAlreadyExists) {
      throw new ConflictException('Username already exists');
    }

    if (emailAlreadyExists) {
      throw new ConflictException('Email already exists');
    }

    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(signUpDTO.password, salt);
    const user = {
      email: signUpDTO.email,
      password: hash,
      username: signUpDTO.username,
    };
    await this.usersRepository.save(user);
    delete user.password;
    return user;
  }

  async findOneByEmail(logInDTO: LogInDTO): Promise<User> {
    const user = await this.usersRepository.findOneBy({
      email: logInDTO.email,
    });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return user;
  }

  async findOne(userId: string): Promise<User | null> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    delete user.password;
    return user;
  }
}
