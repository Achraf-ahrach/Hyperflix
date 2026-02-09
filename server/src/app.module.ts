// server/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
import KeyvRedis from '@keyv/redis';

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
      envFilePath: '../.env',
    }),
    HttpModule,
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async (configService: ConfigService) => {
        const store = new KeyvRedis(
          `redis://${configService.get('REDIS_HOST')}:${configService.get('REDIS_PORT')}`,
        );
        return {
          store: () => store,
          ttl: 604800000, // 7 days in milliseconds
        };
      },
      inject: [ConfigService],
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
    CommentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
