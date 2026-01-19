import { IsOptional, IsString, IsIn } from 'class-validator';

export class CommentMediaDto {
  @IsString()
  id: string;

  @IsIn(['image'])
  type: 'image';

  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  alt?: string;
}
