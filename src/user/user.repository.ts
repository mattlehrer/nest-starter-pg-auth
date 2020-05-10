import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { OAuthProvider } from 'src/auth/interfaces/oauth-providers.interface';
import { EntityRepository, Repository } from 'typeorm';
import { AuthCredentialsDto } from '../auth/dto/auth-credentials.dto';
import { User } from './user.entity';

@EntityRepository(User)
export class UserRepository extends Repository<User> {
  async createWithPassword(
    authCredentialsDto: AuthCredentialsDto,
  ): Promise<User> {
    const { username, email, password } = authCredentialsDto;

    const user = this.create();
    user.username = username;
    user.email = email;
    const { salt, passwordHash } = await this.hashNewPassword(password);
    user.salt = salt;
    user.password = passwordHash;

    try {
      await user.save();
    } catch (error) {
      if (error.code === '23505') {
        // duplicate on unique column
        throw new ConflictException(error.detail);
      } else {
        console.error(error);
        throw new InternalServerErrorException();
      }
    }
    return user;
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
    const user = this.create();
    user.username = `${profile.provider}id${profile.id}`;
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
        console.error(error);
        throw new InternalServerErrorException();
      }
    }
    return user;
  }

  async findByProviderId(profile: any): Promise<User> {
    return this.createQueryBuilder('user')
      .where(`user.${profile.provider} = :profileId`, { profileId: profile.id })
      .getOne();
  }

  async hashNewPassword(
    password: string,
  ): Promise<{ salt: string; passwordHash: string }> {
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);
    return { salt, passwordHash };
  }

  async validateUserPassword(
    authCredentialsDto: AuthCredentialsDto,
  ): Promise<string> {
    const { username, password } = authCredentialsDto;
    const user = await this.findOne({ username });

    if (user && (await user.validatePassword(password))) {
      return user.username;
    } else {
      return null;
    }
  }
}
