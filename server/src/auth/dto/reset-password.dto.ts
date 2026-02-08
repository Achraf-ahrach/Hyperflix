import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'newStrongPassword123',
    description: 'New password (minimum 6 characters)',
  })
  @IsString()
  token: string;

  @ApiProperty({
    example: 'newStrongPassword123',
    description: 'New password (minimum 6 characters)',
  })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
