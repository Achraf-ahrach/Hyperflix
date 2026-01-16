

import { IsOptional, IsString, IsEmail } from 'class-validator';

export class PasswordSettingsDto
{
  @IsString()
  current_password?: string;

  @IsString()
  new_password?: string;

  @IsString()
  confirm_password?: string;
}