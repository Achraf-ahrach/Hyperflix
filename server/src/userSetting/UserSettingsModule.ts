import { Module } from '@nestjs/common';
import { UsersSettingsController } from './controller/update-settings.controller';
import { SettingsService } from './service/settings.service';
import { SettingsRepository } from './repository/settings.repository';

@Module({
  controllers: [UsersSettingsController],
  providers: [SettingsService, SettingsRepository],
  exports: [SettingsService],
})
export class UserSettingsModule {}
