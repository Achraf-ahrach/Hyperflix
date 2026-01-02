



import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
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

  async updateMail(userId: number, dto: AccountSettingsDto) {
    console.log(dto);
    // const user = await this.usersRepository.findById(userId);
    // if (!user) throw new NotFoundException('User not found');

    return true;
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
