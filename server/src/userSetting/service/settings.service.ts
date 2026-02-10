


import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { SettingsRepository } from '../repository/settings.repository';
import { ProfileSettingsDto } from '../dto/profile-settings.dto';
import { PreferencesSettingsDto } from '../dto/preferences-settings.dto';


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
    if (dto.firstName !== undefined){
      if (dto.firstName.length > 100) {
        throw new BadRequestException('First name must be at most 100 characters long');
      }
      updateData.firstName = dto.firstName  ;
    }

    if (dto.lastName !== undefined) {
      if (dto.lastName.length > 100) {
        throw new BadRequestException('Last name must be at most 100 characters long');
      }
      updateData.lastName = dto.lastName;
    }

    if (dto.username !== undefined){
      if (dto.username.length > 50) {
        throw new BadRequestException('Username must be at most 50 characters long');
      }
      updateData.username = dto.username;
    }
    if (dto.avatarUrl !== undefined){
      if (dto.avatarUrl.length > 1000) {
        throw new BadRequestException('Avatar URL must be at most 1000 characters long');
      }
      updateData.avatarUrl = dto.avatarUrl;
    }

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

  async updatePreferences(id: number, dto: PreferencesSettingsDto) {
    const updateData: any = {};
    if (dto.showWatchedPublic !== undefined) {
      updateData.showWatchedPublic = dto.showWatchedPublic;
    }
    if (dto.showWatchlistPublic !== undefined) {
      updateData.showWatchlistPublic = dto.showWatchlistPublic;
    }

    if (Object.keys(updateData).length === 0) {
      return { message: 'No preference changes detected' };      console.log(dto);
    }

    await this.settingRepository.updatePreferences(id, updateData);
    return updateData;
  }
}
