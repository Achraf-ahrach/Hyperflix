



import { BadRequestException, Injectable, NotFoundException, UnauthorizedException, ForbiddenException } from '@nestjs/common';

import * as bcrypt from 'bcrypt';
import { SettingsRepository } from '../repository/settings.repository';
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
    
    const { current_password, new_password, confirm_password } = dto;

    if (!current_password || !new_password || !confirm_password) {
      throw new BadRequestException('Current password, new password, and confirm password are required');
    }

    if (confirm_password !== new_password)
      throw new BadRequestException('Confirm password must equal to new password');

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
      throw new NotFoundException('User not found');
    if (!user.passwordHash)
      throw new ForbiddenException('You are not allowed to modify password');

    const isCurrentPasswordCorrect = await bcrypt.compare(current_password, user.passwordHash);
    if (!isCurrentPasswordCorrect)
      throw new BadRequestException('Wrong current password');

    const passwordHash = await bcrypt.hash(new_password, 10);
    await this.settingsRepository.updatePassword(userId, passwordHash);

    return true;
  }

}
