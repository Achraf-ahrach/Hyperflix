



import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { SettingsRepository } from '../repository/settings.repository';
import { AccountSettingsDto } from '../dto/account-settings.dto';
import { TokenRepository } from '../repository/token.repository';
import { EmailService } from 'src/auth/email.service';
@Injectable()
export class UpdateMailService {
  constructor(
    private usersRepository: SettingsRepository,
    private tokenRepository: TokenRepository,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) { }

  async updateEmailSettings(userId: number, dto: AccountSettingsDto) {

    if (dto.email) {
      const user : any = await this.usersRepository.findByEmail(dto.email);
      if (user)
        throw new BadRequestException('Email already in use');

      const payload = { id: userId, email: dto.email };
      const token = this.jwtService.sign(payload);

      try
      {
        await this.emailService.sendEmailUpdateVerification(dto.email, token);
        await this.tokenRepository.createEmailToken(userId, token);
      }
      catch (error) {
        throw new NotFoundException('Failed to send verification email');
      }

    }
    return { email: dto.email };
  }



  async verifyUpdateMail(key: string) {
    try {
      const payload = this.jwtService.verify<{ email: string; id: number }>(key);
      const savedToken = await this.tokenRepository.findByIdAndToken(payload.id, key);
      if (savedToken.length === 0) {
        throw new UnauthorizedException('Invalid or expired key');
      }

      await this.usersRepository.updateEmail(payload.id, payload.email);
      await this.tokenRepository.deleteById(payload.id);
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired key');
    }
  }

}


