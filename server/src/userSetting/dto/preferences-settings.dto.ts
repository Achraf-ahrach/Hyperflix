import { IsBoolean, IsOptional } from 'class-validator';

export class PreferencesSettingsDto {
  @IsOptional()
  @IsBoolean()
  showWatchedPublic?: boolean;

  @IsOptional()
  @IsBoolean()
  showWatchlistPublic?: boolean;
}
