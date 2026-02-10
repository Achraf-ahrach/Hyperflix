



import { IsOptional, IsString, IsEmail, MaxLength } from 'class-validator';

export class ProfileSettingsDto {

    @IsOptional()
    @IsString()
    @MaxLength(50)
    username?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    firstName?: string;


    @IsOptional()
    @IsString()
    @MaxLength(50)
    lastName?: string;

    
    @IsOptional()
    @IsString()
    avatarUrl?: string;
}
