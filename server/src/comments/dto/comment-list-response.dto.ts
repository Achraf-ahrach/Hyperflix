import { Type } from "class-transformer";
import { CommentDto } from "./comment.dto";



export class CommentListResponseDto {
  @Type(() => CommentDto)
  data: CommentDto[];

  meta: {
    page: number;
    limit: number;
    total: number;
    lastPage: number;
  };
}
