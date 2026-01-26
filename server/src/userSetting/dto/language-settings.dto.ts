

import { IsOptional, IsString, IsEmail } from 'class-validator';

export class LanguageSettingsDto
{

  @IsOptional()
  langue_code?: number;

}
