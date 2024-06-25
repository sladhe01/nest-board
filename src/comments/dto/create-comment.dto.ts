import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  content: string;

  @IsInt()
  boardId: number;

  @IsInt()
  @IsOptional()
  parentCommentId: number;
}
