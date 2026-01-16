



import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { SettingsRepository } from '../repository/settings.repository';
import { AccountSettingsDto } from '../dto/account-settings.dto';
import { TokenRepository } from '../repository/token.repository';
@Injectable()
export class UpdateMailService {
  constructor(
    private usersRepository: SettingsRepository,
    private tokenRepository: TokenRepository,
    private readonly jwtService: JwtService
  ) {}

  async updateEmailSettings(userId: number, dto: AccountSettingsDto) {

    if (dto.email)
    {
      const user = await this.usersRepository.findByEmail(dto.email);
      if (user && user.id != userId)
        throw new BadRequestException('Email already in use');
      await this.usersRepository.updateEmail(userId, dto.email);
    }
    return {email: dto.email};
  }


  async verifyUpdateMail(key : string)
  {
    try {

      const payload = this.jwtService.verify<{ email: string; id: number }>(key);
      const savedToken = this.tokenRepository.findByIdAndToken(payload.id, key);
      if (!savedToken){
        throw new UnauthorizedException('Invalid or expired key');
      }
      
      this.usersRepository.updateEmail(payload.id, payload.email);
      this.tokenRepository.deleteById(payload.id);
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired key');
    }
  }

}
