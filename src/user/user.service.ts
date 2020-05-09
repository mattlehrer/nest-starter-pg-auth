import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { classToPlain } from 'class-transformer';
import { InjectEventEmitter } from 'nest-emitter';
import { AuthCredentialsDto } from 'src/auth/dto/auth-credentials.dto';
import { User } from './user.entity';
import { UserEventEmitter } from './user.events';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
  private logger = new Logger(UserService.name);
  constructor(
    @InjectRepository(UserRepository)
    private userRepository: UserRepository,
    @InjectEventEmitter() private readonly emitter: UserEventEmitter,
  ) {}

  async createWithPassword(
    authCredentialsDto: AuthCredentialsDto,
  ): Promise<User> {
    const user = await this.userRepository.createWithPassword(
      authCredentialsDto,
    );
    this.logger.log(
      `Created user: ${JSON.stringify(classToPlain(user), null, 2)}`,
    );
    this.emitter.emit('newUser', user);
    return user;
  }

  async findOneById(id: number): Promise<User> {
    return this.userRepository.findOne({ id });
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
    const user = await this.userRepository.createWithOAuth({
      profile,
      accessToken,
      refreshToken,
    });
    this.logger.log(
      `Created user: ${JSON.stringify(classToPlain(user), null, 2)}`,
    );
    this.emitter.emit('newUser', user);
    return user;
  }
}
