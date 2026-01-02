



import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';

import * as bcrypt from 'bcrypt';
import { SettingsRepository } from '../repository/settings.repository';
import { AccountSettingsDto } from '../dto/account-settings.dto';
import { PasswordSettingsDto } from '../dto/passwordSetting.dto';



function validateMinLength(password: string, minLength = 8) {
  return password.length >= minLength;
}

function validateUpper(password: string) {
  return /[A-Z]/.test(password);
}


function validateLower(password: string) {
  return /[a-z]/.test(password);
}


function validateNumber(password: string) {
  return /\d/.test(password);
}


function validateSpecial(password: string) {
  return /[!@#$%^&*(),.?":{}|<>]/.test(password);
}






@Injectable()
export class UpdatePasswordService {
  constructor(private settingsRepository: SettingsRepository) {}

  async updatePassword(userId: number, dto: PasswordSettingsDto) {
    
    const { old_password, new_password, confirm_password } = dto;

    if (!old_password || !new_password || !confirm_password) {
      throw new BadRequestException('Old password, new password, and confirm password are required');
    }

    if (confirm_password !== new_password)
      throw new UnauthorizedException('Confirm password must equal to new password');

    if (!validateMinLength(new_password)) {
      throw new BadRequestException('Password must be at least 8 characters long');
    }
    if (!validateUpper(new_password)) {
      throw new BadRequestException('Password must include at least one uppercase letter');
    }
    if (!validateLower(new_password)) {
      throw new BadRequestException('Password must include at least one lowercase letter');
    }
    if (!validateNumber(new_password)) {
      throw new BadRequestException('Password must include at least one number');
    }
    if (!validateSpecial(new_password)) {
      throw new BadRequestException('Password must include at least one special character');
    }


    const user = await this.settingsRepository.findById(userId);
    if (!user)
      throw new UnauthorizedException('User not found');
    if (!user.passwordHash)
      throw new UnauthorizedException('You are not allowed to modify password here');

    const isOldPasswordCorrect = await bcrypt.compare(old_password, user.passwordHash);
    if (!isOldPasswordCorrect)
      throw new UnauthorizedException('Wrong old password');

    const passwordHash = await bcrypt.hash(new_password, 10);
    await this.settingsRepository.updatePassword(userId, passwordHash);


    return true;
  }

}
