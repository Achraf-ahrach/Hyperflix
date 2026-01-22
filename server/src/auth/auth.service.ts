import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private configService: ConfigService,
    private emailService: EmailService,
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
    firstName: string;
    lastName: string;
    password: string;
  }) {
    const existingUser = await this.usersService.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('User already exists');
    }
    
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
    
    const newUser = await this.usersService.createUser({
      email: userData.email,
      username: userData.username,
      firstName: userData.firstName,
      lastName: userData.lastName,
      passwordHash: hashedPassword,
      provider: 'local',
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
    });
    
    // Send verification email
    await this.emailService.sendVerificationEmail(userData.email, verificationToken);
    
    const { passwordHash, emailVerificationToken: token, ...result } = newUser;
    return result;
  }

  async verifyEmail(token: string) {
    const user = await this.usersService.findByVerificationToken(token);
    
    if (!user) {
      throw new Error('Invalid verification token');
    }
    
    if (user.emailVerificationExpires && new Date(user.emailVerificationExpires) < new Date()) {
      throw new Error('expired');
    }
    
    await this.usersService.verifyUserEmail(user.id);
    
    return { message: 'Email verified successfully' };
  }

  async resendVerificationEmail(email: string) {
    const user = await this.usersService.findByEmail(email);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    if (user.isEmailVerified) {
      throw new Error('Email already verified');
    }
    
    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    
    // Update user with new token
    await this.usersService.updateVerificationToken(user.id, verificationToken, verificationExpires);
    
    // Send new verification email
    await this.emailService.sendVerificationEmail(email, verificationToken);
    
    return { message: 'Verification email sent successfully' };
  }
}
