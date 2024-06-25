import { PartialType } from '@nestjs/mapped-types';
import { CreateBoardDto } from './create-board.dto';
import { IsEnum, IsString, IsArray, IsOptional } from 'class-validator';
import { BoardCategory } from '../board-category.enum';
export class UpdateBoardDto extends PartialType(CreateBoardDto) {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsEnum(BoardCategory)
  @IsOptional()
  category?: BoardCategory;

  @IsArray()
  @IsOptional()
  addingFiles?: Express.Multer.File[];

  @IsArray()
  @IsOptional()
  deletingFileIds?: number[];
}
