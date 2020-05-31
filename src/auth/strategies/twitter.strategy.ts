import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Profile, Strategy } from 'passport-twitter';
import { User } from 'src/user/user.entity';
import { AuthService } from '../auth.service';

@Injectable()
export class TwitterStrategy extends PassportStrategy(Strategy, 'twitter') {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    super({
      consumerKey: configService.get('twitter.consumerKey'),
      consumerSecret: configService.get('twitter.consumerSecret'),
      callbackURL:
        configService.get('server.baseUrl') +
        configService.get('twitter.callbackUrl'),
      passReqToCallback: true,
      includeEmail: true,
      scope: ['include_email=true'],
    });
  }

  async validate(
    request: Request,
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ): Promise<User> {
    if (!profile._json.email) {
      profile._json.email = profile.emails?.[0]?.value;
    }
    const user = await this.authService.validateOAuthLogin({
      profile,
      accessToken,
      refreshToken,
      code: request.query.code as string,
    });

    return user;
  }
}
