import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private configService: ConfigService,
  ) {}

  async validateLocalUser(userData: { email: string; password: string }) {
    const user = await this.usersService.findByEmail(userData.email);

    if (
      user &&
      user.passwordHash &&
      (await bcrypt.compare(userData.password, user.passwordHash))
    ) {
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async validateOAuthUser(oauthData: {
    provider: string;
    providerId: string;
    email: string;
    username: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
  }) {
    // Try to find user by provider ID first
    let user = await this.usersService.findByProviderId(
      oauthData.provider,
      oauthData.providerId,
    );

    if (!user) {
      // Try to find by email
      user = await this.usersService.findByEmail(oauthData.email);

      if (user) {
        // Link OAuth account to existing user
        user = await this.usersService.updateUserProvider(user.id, {
          provider: oauthData.provider,
          providerId: oauthData.providerId,
        });
      } else {
        // Create new user
        user = await this.usersService.createOAuthUser(oauthData);
      }
    }

    const { passwordHash, ...result } = user;
    return result;
  }

  async login(userData: { email: string; id: number }) {
    const payload = { username: userData.email, sub: userData.id };

    const accessToken = this.jwtService.sign(payload);

    const expiresIn =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '30d';
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: expiresIn as any,
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async register(userData: {
    email: string;
    username: string;
    password: string;
  }) {
    const existingUser = await this.usersService.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('User already exists');
    }
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const newUser = await this.usersService.createUser({
      email: userData.email,
      username: userData.username,
      passwordHash: hashedPassword,
      provider: 'local',
    });
    const { passwordHash, ...result } = newUser;
    return result;
  }
}
