


import { Injectable, NotFoundException } from '@nestjs/common';

import { SettingsRepository } from '../repository/settings.repository';
import { AccountSettingsDto } from '../dto/account-settings.dto';

@Injectable()
export class SettingsService {
  constructor(private usersRepository: SettingsRepository) {}

  async updateUserSettings(dto: AccountSettingsDto) {
    console.log(dto);
    // const user = await this.usersRepository.findById(userId);
    // if (!user) throw new NotFoundException('User not found');

    return true;
  }

}
