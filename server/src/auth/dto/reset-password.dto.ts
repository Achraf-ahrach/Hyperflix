import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { ApiProperty } from '@nestjs/swagger';

const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#]).{8,}$/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&#)',
    ),
});

export class ResetPasswordDto extends createZodDto(ResetPasswordSchema) {
  @ApiProperty({
    example: 'abc123def456ghi789',
    description: 'Password reset token',
  })
  token: string;

  @ApiProperty({
    example: 'NewStrong@Pass123',
    description: 'New password (minimum 8 characters)',
  })
  newPassword: string;
}
