import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthCredentialsDto } from 'src/auth/dto/auth-credentials.dto';
import { User } from './user.entity';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserRepository)
    private userRepository: UserRepository,
  ) {}

  async create(authCredentialsDto: AuthCredentialsDto): Promise<void> {
    return this.userRepository.signUp(authCredentialsDto);
  }

  async findOneById(id: number): Promise<User> {
    return this.userRepository.findOne({ id: id });
  }

  async findOneByUsername(username: string): Promise<User> {
    return this.userRepository.findOne({ username });
  }

  async findOneByEmail(email: string): Promise<User> {
    return this.userRepository.findOne({ email });
  }
}
