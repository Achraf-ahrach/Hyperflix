import { Module } from '@nestjs/common';
import { UsersSettingsController } from './controller/update-settings.controller';
import { SettingsService } from './service/settings.service';
import { SettingsRepository } from './repository/settings.repository';
import { UpdateMailService } from './service/updateMail.service';
import { TokenRepository } from './repository/token.repository';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { UpdatePasswordService } from './service/updatePassword.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [UsersSettingsController],
  providers: [SettingsService, SettingsRepository, UpdateMailService, TokenRepository, UpdatePasswordService],
  exports: [SettingsService, UpdateMailService, TokenRepository],
  imports: [AuthModule,
        JwtModule.register({
        secret: process.env.JWT_SECRET || 'default-secret-key',
        signOptions: { expiresIn: '24h' },
      }),]
})
export class UserSettingsModule {}
