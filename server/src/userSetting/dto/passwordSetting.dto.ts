

import { IsOptional, IsString, IsEmail } from 'class-validator';

export class PasswordSettingsDto
{
  @IsString()
  old_password?: string;

  @IsString()
  new_password?: string;

  @IsString()
  confirm_password?: string;
}