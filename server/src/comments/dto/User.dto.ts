

import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UserDto {
  @IsString()
  id: string;

  @IsString()
  username: string;

  @IsString()
  avatar: string;

  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;
}
