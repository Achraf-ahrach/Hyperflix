import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    const clientID = configService.get<string>('GITHUB_CLIENT_ID');
    const clientSecret = configService.get<string>('GITHUB_CLIENT_SECRET');
    const callbackURL = configService.get<string>('GITHUB_CALLBACK_URL');

    if (!clientID || !clientSecret || !callbackURL) {
      throw new Error('GitHub OAuth credentials are not properly configured');
    }

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: any,
  ): Promise<any> {
    const { id, emails, displayName, username, photos } = profile;

    // GitHub may not provide email if it's private, use username as fallback
    const email = emails?.[0]?.value || `${username}@users.noreply.github.com`;

    const user = await this.authService.validateOAuthUser({
      provider: 'github',
      providerId: id,
      email: email,
      username: username || displayName,
      firstName: displayName?.split(' ')[0] || username || '',
      lastName: displayName?.split(' ').slice(1).join(' ') || '',
      avatarUrl: photos?.[0]?.value || null,
    });

    done(null, user);
  }
}
