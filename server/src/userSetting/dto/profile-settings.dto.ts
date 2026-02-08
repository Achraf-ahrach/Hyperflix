



import { IsOptional, IsString, IsEmail } from 'class-validator';

export class ProfileSettingsDto {

    @IsOptional()
    @IsString()
    username?: string;

    @IsOptional()
    @IsString()
    firstName?: string;


    @IsOptional()
    @IsString()
    lastName?: string;

    
    @IsOptional()
    @IsString()
    avatarUrl?: string;
}
