

import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ReplyDto } from './CreateReply.dto';
import { CommentMediaDto } from './comment-media.dto';

export class CommentDto {
  @IsString()
  id: string;

  @IsString()
  userId: string;

  @IsString()
  username: string;

  @IsString()
  userAvatar: string;

  @IsString()
  content: string;

  @IsInt()
  likes: number;

  @IsBoolean()
  isLiked: boolean;

  @IsArray()
  @Type(() => ReplyDto)
  replies: ReplyDto[];

  @IsInt()
  replyCount: number;

  @IsOptional()
  @IsArray()
  @Type(() => CommentMediaDto)
  media?: CommentMediaDto[];

  @IsString()
  createdAt: string;

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;
}
