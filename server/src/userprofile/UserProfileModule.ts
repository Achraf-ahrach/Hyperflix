import { Module } from '@nestjs/common';
import { UsersProfileController } from './controller/profile.controller';
import { userProfileService } from './service/userProfile.service';
import { UserCommentsRepository } from './repository/userComments.repository';
import { UserWatchedMoviesRepository } from './repository/userWatched.repository';
import { UserWatchLaterRepository } from './repository/userWatchLater.repository';

@Module({
  controllers: [UsersProfileController],
  providers: [userProfileService,
    UserCommentsRepository,
    UserWatchedMoviesRepository,
    UserWatchLaterRepository

  ],
  exports: [userProfileService],
})
export class UserProfileModule { }
