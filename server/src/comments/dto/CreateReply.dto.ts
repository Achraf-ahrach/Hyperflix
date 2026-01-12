// dto/create-reply.dto.ts
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class ReplyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;
}