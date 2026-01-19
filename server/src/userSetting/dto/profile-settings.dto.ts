



import { IsOptional, IsString, IsEmail } from 'class-validator';

export class ProfileSettingsDto {

    @IsOptional()
    @IsString()
    username?: string;

    @IsOptional()
    @IsString()
    first_name?: string;


    @IsOptional()
    @IsString()
    last_name?: string;

}
