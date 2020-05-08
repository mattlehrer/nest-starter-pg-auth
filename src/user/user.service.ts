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

  async createWithPassword(
    authCredentialsDto: AuthCredentialsDto,
  ): Promise<void> {
    return this.userRepository.createWithPassword(authCredentialsDto);
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

  async findOrCreateOneByOAuth({
    profile,
    accessToken,
    refreshToken,
  }: {
    profile: any;
    accessToken: string;
    refreshToken: string;
  }): Promise<User> {
    const existingUser = await this.userRepository.findByProviderId(profile);
    if (existingUser) {
      console.log(existingUser);
      return existingUser;
    }
    return this.userRepository.createWithOAuth({
      profile,
      accessToken,
      refreshToken,
    });
  }
}
