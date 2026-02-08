


import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { SettingsRepository } from '../repository/settings.repository';
import { ProfileSettingsDto } from '../dto/profile-settings.dto';


@Injectable()
export class SettingsService {
  constructor(private settingRepository: SettingsRepository) {}



  async updateProfileSettings(id: number, dto: ProfileSettingsDto) {
    console.log(dto);
    if (dto.username) {
      const user = await this.settingRepository.findByUsername(dto.username);
      if (user && user.id !== id) {
        throw new BadRequestException('This username already exists');
      }
    }

    const updateData: Partial<ProfileSettingsDto> = {};
    if (dto.firstName !== undefined) updateData.firstName = dto.firstName  ;
    if (dto.lastName !== undefined) updateData.lastName = dto.lastName;
    if (dto.username !== undefined) updateData.username = dto.username;
    if (dto.avatarUrl !== undefined) updateData.avatarUrl = dto.avatarUrl;

    if (Object.keys(updateData).length > 0) {
      const result = await this.settingRepository.updateProfile(id, updateData);
      if (result) {
        return updateData;
      }
    }

    return { message: 'Profile updated successfully' };
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
