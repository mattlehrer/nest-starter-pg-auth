import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Profile, Strategy } from 'passport-github2';
import { User } from 'src/user/user.entity';
import { AuthService } from '../auth.service';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    super({
      clientID: configService.get('github.clientId'),
      clientSecret: configService.get('github.clientSecret'),
      callbackURL:
        configService.get('server.baseUrl') +
        configService.get('github.callbackUrl'),
      passReqToCallback: true,
      scope: ['user:email'],
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
