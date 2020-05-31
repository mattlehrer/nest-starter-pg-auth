import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Profile } from 'passport';
import { Strategy } from 'passport-facebook';
import { User } from 'src/user/user.entity';
import { AuthService } from '../auth.service';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    super({
      clientID: configService.get('facebook.appId'),
      clientSecret: configService.get('facebook.appSecret'),
      callbackURL:
        configService.get('server.baseUrl') +
        configService.get('facebook.callbackUrl'),
      passReqToCallback: true,
      scope: ['email', 'public_profile'],
      profileFields: ['id', 'displayName', 'photos', 'email'],
    });
  }

  async validate(
    request: Request,
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ): Promise<User> {
    const user = await this.authService.validateOAuthLogin({
      profile,
      accessToken,
      refreshToken,
      code: request.query.code as string,
    });

    return user;
  }
}
