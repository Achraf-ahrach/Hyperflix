

import { IsOptional, IsString, IsEmail } from 'class-validator';

export class AccountSettingsDto
{

  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;

}
