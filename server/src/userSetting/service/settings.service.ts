


import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { SettingsRepository } from '../repository/settings.repository';
import { AccountSettingsDto } from '../dto/account-settings.dto';
import { ProfileSettingsDto } from '../dto/profile-settings.dto';


@Injectable()
export class SettingsService {
  constructor(private settingRepository: SettingsRepository) {}



  async updateProfileSettings(id: number, dto: ProfileSettingsDto) {
    if (dto.username) {
      const user = await this.settingRepository.findByUsername(dto.username);
      if (user && user.id !== id) { // Also check it's not the same user
        throw new BadRequestException('This username already exists');
      }
    }

      const updateData: Partial<ProfileSettingsDto> = {};
      if (dto.first_name !== undefined) updateData.first_name = dto.first_name;
      if (dto.last_name !== undefined) updateData.last_name = dto.last_name;
      if (dto.username !== undefined) updateData.username = dto.username;

      if (Object.keys(updateData).length > 0) {
        await this.settingRepository.updateProfile(id, updateData);
      }

    return true;
  }

  async updateProfileAvatar(id: number, url: string)
  {
    return await this.settingRepository.updateProfileAvatar(id, url);
  }


  async updateLanguage(id: number, dto: any) {
    if (dto.language_code !== undefined)
    {

      console.log(dto);
      try
      {
        await this.settingRepository.updateLanguage(id, dto.language_code);
      }
      catch (err)
      {
        console.error(err);
        throw new NotFoundException('Language not found');
      }
      return {message: 'Language updated successfully'};
    }
  }
}
