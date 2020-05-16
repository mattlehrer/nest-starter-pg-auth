import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { classToPlain } from 'class-transformer';
import { InjectEventEmitter } from 'nest-emitter';
import { AuthCredentialsDto } from 'src/auth/dto/auth-credentials.dto';
import { OAuthProvider } from 'src/auth/interfaces/oauth-providers.interface';
import { Repository } from 'typeorm';
import { UpdateUserInput } from './dto/update-user.dto';
import { User } from './user.entity';
import { UserEventEmitter } from './user.events';

@Injectable()
export class UserService {
  private logger = new Logger(UserService.name);
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectEventEmitter() private readonly emitter: UserEventEmitter,
  ) {}

  async createWithPassword(
    authCredentialsDto: AuthCredentialsDto,
  ): Promise<User> {
    const user = this.userRepository.create(authCredentialsDto);
    await user.save();
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
    const existingUser = await this.findByProviderId(profile);
    if (existingUser) {
      return existingUser;
    }
    return await this.createWithOAuth({
      profile,
      accessToken,
      refreshToken,
    });
  }

  async update(user: User, fieldsToUpdate: UpdateUserInput): Promise<User> {
    if (fieldsToUpdate.username) {
      if (fieldsToUpdate.username === user.username) {
        delete fieldsToUpdate.username;
      } else {
        const duplicateUser = await this.findOneByUsername(
          fieldsToUpdate.username,
        );
        if (duplicateUser) {
          throw new ConflictException(
            `${fieldsToUpdate.username} is unavailable.`,
          );
        }
      }
    }

    if (fieldsToUpdate.email) {
      if (fieldsToUpdate.email === user.email) {
        delete fieldsToUpdate.email;
      } else {
        const duplicateUser = await this.findOneByEmail(fieldsToUpdate.email);
        if (duplicateUser) {
          throw new ConflictException(
            `${fieldsToUpdate.email} is in use by another user.`,
          );
        }
      }
    }

    if (fieldsToUpdate.oldPassword) {
      if (await user.validatePassword(fieldsToUpdate.oldPassword)) {
        user.password = fieldsToUpdate.newPassword;
      } else {
        throw new UnauthorizedException('Incorrect existing password.');
      }
    }

    // Remove undefined keys for update
    for (const key in fieldsToUpdate) {
      if (
        typeof fieldsToUpdate[key] !== 'undefined' &&
        !['password', 'oldPassword', 'newPassword'].includes(key)
      ) {
        user[key] = fieldsToUpdate[key];
      }
    }

    if (Object.entries(fieldsToUpdate).length > 0) {
      await user.save();
    }

    return user;
  }

  async findByProviderId(profile: any): Promise<User> {
    return this.userRepository
      .createQueryBuilder('user')
      .where(`user.${profile.provider} = :profileId`, { profileId: profile.id })
      .getOne();
  }

  async createWithOAuth({
    profile,
    accessToken,
    refreshToken,
  }: {
    profile: any;
    accessToken: string;
    refreshToken: string;
  }): Promise<User> {
    const user = this.userRepository.create();
    user.email = profile._json.email;
    user[profile.provider as OAuthProvider] = profile.id;
    user.tokens = {};
    user.tokens[profile.provider as OAuthProvider] = {
      accessToken,
      refreshToken,
    };

    try {
      await user.save();
    } catch (error) {
      if (error.code === '23505') {
        // duplicate on unique column
        throw new ConflictException(error.detail);
      } else {
        this.logger.error(error);
        throw new InternalServerErrorException();
      }
    }
    this.logger.log(
      `Created user: ${JSON.stringify(classToPlain(user), null, 2)}`,
    );
    this.emitter.emit('newUser', user);
    return user;
  }
}
