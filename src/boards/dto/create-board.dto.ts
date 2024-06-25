import { IsString, IsEnum, IsOptional } from 'class-validator';
import { BoardCategory } from '../board-category.enum';
export class CreateBoardDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsEnum(BoardCategory)
  category: BoardCategory;
}
