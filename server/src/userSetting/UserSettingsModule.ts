import { Module } from '@nestjs/common';
import { UsersSettingsController } from './controller/update-settings.controller';
import { SettingsService } from './service/settings.service';
import { SettingsRepository } from './repository/settings.repository';
import { UpdateMailService } from './service/updateMail.service';
import { TokenRepository } from './repository/token.repository';
import { JwtService } from '@nestjs/jwt';
import { UpdatePasswordService } from './service/updatePassword.service';

@Module({
  controllers: [UsersSettingsController],
  providers: [SettingsService, SettingsRepository, UpdateMailService, TokenRepository, JwtService, UpdatePasswordService],
  exports: [SettingsService, UpdateMailService, TokenRepository],
})
export class UserSettingsModule {}
