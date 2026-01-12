// server/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserSettingsModule } from './userSetting/UserSettingsModule';
import { UsersProfileController } from './userprofile/controller/profile.controller';
import { UserProfileModule } from './userprofile/UserProfileModule';
import { CommentsModule } from './comments/commentsModule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
    }),
    DatabaseModule,
    AuthModule,
    UserSettingsModule,
    UserProfileModule,
    CommentsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
