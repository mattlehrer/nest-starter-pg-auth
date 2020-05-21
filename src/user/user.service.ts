import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { classToPlain } from 'class-transformer';
import { InjectEventEmitter } from 'nest-emitter';
import { Profile } from 'passport';
import { SignUpDto } from 'src/auth/dto/sign-up.dto';
import { OAuthProvider } from 'src/auth/interfaces/oauth-providers.interface';
import { LoggerService } from 'src/logger/logger.service';
import { Repository, UpdateResult } from 'typeorm';
import { v4 as uuid } from 'uuid';
import normalizeEmail from 'validator/lib/normalizeEmail';
import { UpdateUserInput } from './dto/update-user.dto';
import { User } from './user.entity';
import { UserEventEmitter } from './user.events';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectEventEmitter() private readonly emitter: UserEventEmitter,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(UserService.name);
  }

  async createWithPassword(signUpDto: SignUpDto): Promise<User> {
    const user = this.userRepository.create(signUpDto);
    await this.handleSave(user);
    this.logger.log(
      `Created user: ${JSON.stringify(classToPlain(user), null, 2)}`,
    );
    this.emitter.emit('newUser', user);
    return user;
  }

  async createWithOAuth({
    profile,
    accessToken,
    refreshToken,
    code,
  }: {
    profile: any;
    accessToken: string;
    refreshToken: string;
    code: string;
  }): Promise<User> {
    const user = this.userRepository.create({
      username: uuid(),
      email: profile._json.email,
      [profile.provider as OAuthProvider]: profile.id,
      tokens: {
        [profile.provider as OAuthProvider]: {
          accessToken,
          refreshToken,
          code,
        },
      },
    });

    await this.handleSave(user);
    this.logger.log(
      `Created user: ${JSON.stringify(classToPlain(user), null, 2)}`,
    );
    this.emitter.emit('newUser', user);
    return user;
  }

  async findOrCreateOneByOAuth({
    profile,
    accessToken,
    refreshToken,
    code,
  }: {
    profile: any;
    accessToken: string;
    refreshToken: string;
    code: string;
  }): Promise<User> {
    const existingUser = await this.findByProviderId(profile);
    if (existingUser) {
      return existingUser;
    }
    return await this.createWithOAuth({
      profile,
      accessToken,
      refreshToken,
      code,
    });
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findAllIncludingDeleted(): Promise<User[]> {
    return await this.userRepository
      .createQueryBuilder('user')
      .withDeleted()
      .getMany();
  }

  async findAllDeleted(): Promise<User[]> {
    return await this.userRepository
      .createQueryBuilder('user')
      .withDeleted()
      .where('deleted_at is not null')
      .getMany();
  }

  async findOneById(id: number): Promise<User> {
    return this.userRepository.findOne({ id });
  }

  async findOneByUsername(username: string): Promise<User> {
    return this.userRepository.findOne({
      normalizedUsername: username.toLowerCase(),
    });
  }

  async findOneByEmail(email: string): Promise<User> {
    return this.userRepository.findOne({
      normalizedEmail: normalizeEmail(email) as string,
    });
  }

  async findByProviderId(profile: Profile): Promise<User> {
    return this.userRepository
      .createQueryBuilder('user')
      .where(`user.${profile.provider} = :profileId`, { profileId: profile.id })
      .getOne();
  }

  async updateOne(
    user: Partial<User>,
    fieldsToUpdate: UpdateUserInput,
  ): Promise<void> {
    // don't use userRepository.update because
    // @BeforeUpdate listener only runs on save

    user = await this.findOneById(user.id);

    if (fieldsToUpdate.oldPassword) {
      if (await user.validatePassword(fieldsToUpdate.oldPassword)) {
        user.password = fieldsToUpdate.newPassword;
      } else {
        throw new UnauthorizedException('Incorrect existing password.');
      }
    }

    // Remove undefined keys for update
    for (const key in fieldsToUpdate) {
      if (typeof fieldsToUpdate[key] === 'undefined') {
        delete fieldsToUpdate[key];
      } else {
        user[key] = fieldsToUpdate[key];
      }
    }

    if (Object.entries(fieldsToUpdate).length > 0) {
      try {
        await user.save();
      } catch (error) {
        this.handleDbError(error);
      }
    }

    return;
  }

  async deleteOne(user: Partial<User>): Promise<void> {
    const result = await this.userRepository.softDelete(user.id);
    return this.handleDbUpdateResult(result);
  }

  private async handleSave(user: User) {
    try {
      await user.save();
    } catch (error) {
      this.handleDbError(error);
    }
  }

  private handleDbError(error: any) {
    if (error.code === '23505') {
      // duplicate on unique column
      error.detail = error.detail
        .replace('Key ("', '')
        .replace('normalized', '')
        .replace('")=(', " '")
        .replace(')', "'");
      throw new ConflictException(error.detail);
    } else {
      this.logger.error({ error });
      throw new InternalServerErrorException();
    }
  }

  private handleDbUpdateResult(result: UpdateResult) {
    if (result.affected) {
      return;
    }
    this.logger.error(result);
    throw new InternalServerErrorException();
  }
}
