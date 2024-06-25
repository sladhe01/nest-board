import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { CommentEntity } from './entities/comment.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(CommentEntity)
    private commentRepository: Repository<CommentEntity>,
  ) {}

  async createComment(createCommentDto: CreateCommentDto, authorEmail: string) {
    const { content, boardId, parentCommentId } = createCommentDto;
    const comment = await this.commentRepository.save({
      authorEmail: authorEmail,
      content: content,
      boardId: boardId,
      parentCommentId: parentCommentId,
    });

    return comment;
  }

  async getAuthorById(commentId: number) {
    const comment = await this.commentRepository.findOneOrFail({
      where: { id: commentId },
    });
    return comment.authorEmail;
  }

  async updateComment(commentId: number, updateCommentDto: UpdateCommentDto) {
    const { content } = updateCommentDto;
    if (!content) {
      throw new BadRequestException('Fill content');
    }
    return await this.commentRepository.update(commentId, { content: content });
  }

  async removeComment(commentId: number) {
    return await this.commentRepository.softDelete(commentId);
  }
}
