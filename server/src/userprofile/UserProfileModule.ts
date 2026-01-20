import { Module } from '@nestjs/common';
import { UsersProfileController } from './controller/profile.controller';
import { UserProfileService } from './service/userProfile.service';
import { UserCommentsRepository } from './repository/userComments.repository';
import { UserWatchedMoviesRepository } from './repository/userWatched.repository';
import { UserWatchLaterRepository } from './repository/userWatchLater.repository';

@Module({
  controllers: [UsersProfileController],
  providers: [UserProfileService,
    UserCommentsRepository,
    UserWatchedMoviesRepository,
    UserWatchLaterRepository

  ],
  exports: [UserProfileService],
})
export class UserProfileModule { }
