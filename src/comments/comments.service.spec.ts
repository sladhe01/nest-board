import { Test, TestingModule } from '@nestjs/testing';
import { CommentsService } from './comments.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CommentEntity } from './entities/comment.entity';
import { Repository } from 'typeorm';

describe('CommentsService', () => {
  let service: CommentsService;
  let commentRepository: Repository<CommentEntity>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        {
          provide: getRepositoryToken(CommentEntity),
          useValue: {
            save: jest.fn(),
            findOneOrFail: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
    commentRepository = module.get<Repository<CommentEntity>>(
      getRepositoryToken(CommentEntity),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createComment', () => {
    it('should create comment successfully', async () => {
      const createCommentDto = {
        content: 'test',
        boardId: 2,
        parentCommentId: 1,
      };
      const authorEmail = 'test@test.com';
      const saved = {
        authorEmail: authorEmail,
        content: createCommentDto.content,
        boardId: createCommentDto.boardId,
        parentCommentId: createCommentDto.parentCommentId,
      } as CommentEntity;
      jest.spyOn(commentRepository, 'save').mockResolvedValueOnce(saved);

      const result = await service.createComment(createCommentDto, authorEmail);

      expect(commentRepository.save).toHaveBeenCalledWith(saved);
      expect(result).toEqual(saved);
    });
  });

  describe('getAuthorById', () => {
    it('should get authorEmail by commentId', async () => {
      const commentId = 4;
      const authorEmail = 'email@email.com';
      const found = {
        id: commentId,
        content: 'test',
        authorEmail: authorEmail,
        parentCommentId: 2,
      } as CommentEntity;
      jest
        .spyOn(commentRepository, 'findOneOrFail')
        .mockResolvedValueOnce(found);

      const result = await service.getAuthorById(commentId);

      expect(commentRepository.findOneOrFail).toHaveBeenCalledWith({
        where: { id: commentId },
      });
      expect(result).toEqual(found.authorEmail);
    });
  });

  describe('updateComment', () => {
    it('should update comment successfully', async () => {
      const commentId = 5;
      const updateCommnetDto = { content: 'test' };
      const updated = { affected: 1 };
      jest
        .spyOn(commentRepository, 'update')
        .mockResolvedValueOnce(updated as any);

      const result = await service.updateComment(commentId, updateCommnetDto);

      expect(commentRepository.update).toHaveBeenCalledWith(commentId, {
        content: updateCommnetDto.content,
      });
      expect(result).toEqual(updated);
    });

    it('should throw error for empty content', async () => {
      const commentId = 6;

      await expect(service.updateComment(commentId, {} as any)).rejects.toThrow(
        'Fill content',
      );
    });
  });

  describe('removeComment', () => {
    it('should soft delete a comment by commentId', async () => {
      const commentId = 1;

      const deleted = { affected: 1 };
      jest
        .spyOn(commentRepository, 'softDelete')
        .mockResolvedValueOnce(deleted as any);

      const result = await service.removeComment(commentId);

      expect(commentRepository.softDelete).toHaveBeenCalledWith(commentId);
      expect(result).toEqual(deleted);
    });
  });
});
