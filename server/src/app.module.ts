// server/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { MoviesModule } from './movies/movies.module';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { CacheModule } from '@nestjs/cache-manager';

import { UserSettingsModule } from './userSetting/UserSettingsModule';
import { UsersProfileController } from './userprofile/controller/profile.controller';
import { UserProfileModule } from './userprofile/UserProfileModule';
import { CommentsModule } from './comments/commentsModule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'uploads'),
      serveStaticOptions: {
        fallthrough: false,
      },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env.local',
    }),
    HttpModule,
    CacheModule.register({
      ttl: 60 * 60 * 1000 * 24, // 24 hours
      max: 300,
      isGlobal: true,
    }),
    AuthModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default-secret-key',
      signOptions: { expiresIn: '1h' },
    }),
    DatabaseModule,
    MoviesModule,
    UserSettingsModule,
    UserProfileModule,
    CommentsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
