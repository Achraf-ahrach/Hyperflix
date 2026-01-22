import { PassportStrategy } from '@nestjs/passport';
import Strategy = require('passport-42');
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class FortyTwoStrategy extends PassportStrategy(
  Strategy.Strategy,
  '42',
) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    const clientID = configService.get<string>('FORTY_TWO_CLIENT_ID');
    const clientSecret = configService.get<string>('FORTY_TWO_CLIENT_SECRET');
    const callbackURL = configService.get<string>('FORTY_TWO_CALLBACK_URL');

    if (!clientID || !clientSecret || !callbackURL) {
      throw new Error('42 OAuth credentials are not properly configured');
    }

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['public'],
    } as any);
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: any,
  ): Promise<any> {
    const { id, emails, displayName, username, name, _json } = profile;

    const user = await this.authService.validateOAuthUser({
      provider: '42',
      providerId: id,
      email: emails?.[0]?.value || `${username}@student.42.fr`,
      username: username || displayName,
      firstName: name?.givenName || _json?.first_name || '',
      lastName: name?.familyName || _json?.last_name || '',
      avatarUrl: _json?.image?.link || null,
    });

    done(null, user);
  }
}
