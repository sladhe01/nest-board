import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { BoardEntity } from './entities/board.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { FilesService } from 'src/files/files.service';

@Injectable()
export class BoardsService {
  constructor(
    @InjectRepository(BoardEntity)
    private boardRepository: Repository<BoardEntity>,
    private filesService: FilesService,
    private dataSource: DataSource,
  ) {}

  async createBoard(
    createBoardDto: CreateBoardDto,
    authorEmail: string,
    files: Express.Multer.File[],
  ) {
    const { title, category, content } = createBoardDto;
    const newBoard = await this.boardRepository.save({
      title: title,
      category: category,
      content: content,
      authorEmail: authorEmail,
    });
    if (files.length !== 0) {
      await this.filesService.uploadFiles(files, newBoard);
    }

    return;
  }

  async getList(
    page: number,
    limit: number,
    orderBy: 'views' | 'createdAt',
    order: 'DESC' | 'ASC',
    period: 'year' | 'month' | 'week' | 'whole',
    criteria?: 'all' | 'title' | 'author',
    keyword?: string,
  ) {
    let startDate: Date;
    const endDate: Date = new Date();
    if (orderBy === 'views') {
      startDate = await this.getStartDate(period);
    } else {
      startDate = new Date(0);
    }
    const result = this.boardRepository
      .createQueryBuilder('board')
      .where(
        'board.createdAt >= :startDate AND board.createdAt <= :endDate AND board.deletedAt IS NULL',
        {
          startDate,
          endDate,
        },
      )
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy(`board.${orderBy}`, order);

    if (criteria === 'all') {
      return await result
        .andWhere('board.title LIKE :keyword OR board.author LIKE :keyword', {
          keyword: `%${keyword}%`,
        })
        .getMany();
    } else if (criteria === 'title') {
      return await result
        .andWhere('board.title LIKE :keyword', {
          keyword: `%${keyword}%`,
        })
        .getMany();
    } else if (criteria === 'author') {
      return await result
        .andWhere('board.author LIKE :keyword', {
          keyword: `%${keyword}%`,
        })
        .getMany();
    } else return await result.getMany();
  }

  async getOne(boardId: number) {
    await this.increaseView(boardId);
    const board = await this.dataSource
      .getRepository(BoardEntity)
      .createQueryBuilder('board')
      .leftJoinAndSelect('board.comments', 'comment')
      .leftJoinAndSelect('board.files', 'file')
      .where('board.id = :id', { id: boardId })
      .getOne();
    return board;
  }

  private async getStartDate(period: string) {
    let startDate: Date;
    switch (period) {
      case 'year':
        startDate = new Date(
          new Date().getFullYear() - 1,
          new Date().getMonth(),
          new Date().getDate(),
        );
        break;
      case 'month':
        startDate = new Date(
          new Date().getFullYear(),
          new Date().getMonth() - 1,
          new Date().getDate(),
        );
        break;
      case 'week':
        startDate = new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          new Date().getDate() - 7,
        );
        break;
      default:
        startDate = new Date(0);
    }
    return startDate;
  }

  private async increaseView(boardId: number) {
    const board = await this.boardRepository.findOneOrFail({
      where: { id: boardId },
    });
    board.views++;
    await this.boardRepository.save(board);
  }

  async getAuthorByBoardId(boardId: number) {
    const board = await this.boardRepository.findOneOrFail({
      where: { id: boardId },
    });
    return board.authorEmail;
  }

  async updateBoard(boardId: number, updateBoardDto: UpdateBoardDto) {
    const { title, content, category, addingFiles, deletingFileIds } =
      updateBoardDto;
    const filedsToUpdate: Partial<UpdateBoardDto> = {};
    if (Object.keys(updateBoardDto).length === 0) {
      throw new BadRequestException('Nothing to update');
    }
    if (title) {
      filedsToUpdate.title = title;
    }
    if (content !== undefined) {
      filedsToUpdate.content = content;
    }
    if (category) {
      filedsToUpdate.category = category;
    }
    await this.boardRepository.update(boardId, filedsToUpdate);
    if (addingFiles) {
      const board = await this.boardRepository.findOneOrFail({
        where: { id: boardId },
      });
      await this.filesService.uploadFiles(addingFiles, board);
    }
    if (deletingFileIds) {
      await this.boardRepository.softDelete(deletingFileIds);
    }
    return;
  }

  async removeBoard(id: number) {
    return await this.boardRepository.softDelete(id);
  }
}
