

import { IsOptional, IsString, IsEmail } from 'class-validator';

export class LanguageSettingsDto
{

  @IsOptional()
  language_code?: number;

}
