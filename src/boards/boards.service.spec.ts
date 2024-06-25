import { Test, TestingModule } from '@nestjs/testing';
import { BoardsService } from './boards.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BoardEntity } from './entities/board.entity';
import { Repository, DataSource } from 'typeorm';
import { FilesService } from 'src/files/files.service';
import { BoardCategory } from './board-category.enum';
import { FileEntity } from 'src/files/entities/files.entity';

describe('BoardsService', () => {
  let service: BoardsService;
  let boardRepository: Repository<BoardEntity>;
  let filesService: jest.Mocked<FilesService>;
  let dataSource: jest.Mocked<DataSource>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BoardsService,
        {
          provide: getRepositoryToken(BoardEntity),
          useValue: {
            save: jest.fn(),
            update: jest.fn(),
            findOneOrFail: jest.fn(),
            softDelete: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: FilesService,
          useValue: { uploadFiles: jest.fn() },
        },
        { provide: DataSource, useValue: { getRepository: jest.fn() } },
      ],
    }).compile();
    service = module.get<BoardsService>(BoardsService);
    boardRepository = module.get<Repository<BoardEntity>>(
      getRepositoryToken(BoardEntity),
    );
    filesService = module.get(FilesService);
    dataSource = module.get(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createBoard', () => {
    it('should create board successfully', async () => {
      const createBoardDto = {
        title: 'test title',
        category: BoardCategory.Inquiry,
        content: 'test content',
      };
      const authorEmail = 'test@test.com';
      const files = [{ filename: 'file1' } as Express.Multer.File];
      jest
        .spyOn(boardRepository, 'save')
        .mockResolvedValueOnce({} as BoardEntity);
      jest
        .spyOn(filesService, 'uploadFiles')
        .mockResolvedValueOnce([] as FileEntity[]);

      await service.createBoard(createBoardDto, authorEmail, files);

      expect(boardRepository.save).toHaveBeenCalledWith({
        title: 'test title',
        category: BoardCategory.Inquiry,
        content: 'test content',
        authorEmail: 'test@test.com',
      });
      expect(filesService.uploadFiles).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateBoard', () => {
    it('should update a board', async () => {
      const boardId = 1;
      const updateBoardDto = {
        title: 'Updated Title',
        content: 'Updated Content',
        category: BoardCategory.Notice,
        addingFiles: [{ filename: 'file1' } as Express.Multer.File],
        deletingFileIds: [1, 2, 3],
      };
      jest.spyOn(boardRepository, 'update');
      jest.spyOn(boardRepository, 'findOneOrFail');
      jest.spyOn(boardRepository, 'softDelete');
      jest.spyOn(filesService, 'uploadFiles');

      await service.updateBoard(boardId, updateBoardDto);

      expect(boardRepository.update).toHaveBeenCalledWith(boardId, {
        title: 'Updated Title',
        content: 'Updated Content',
        category: BoardCategory.Notice,
      });
      expect(boardRepository.findOneOrFail).toHaveBeenCalledTimes(1);
      expect(boardRepository.softDelete).toHaveBeenCalledWith([1, 2, 3]);
      expect(filesService.uploadFiles).toHaveBeenCalledTimes(1);
    });
  });

  describe('getList', () => {
    it('should get list with criteria and keyword successfully', async () => {
      const mockBoards = [
        {
          id: 1,
          title: 'test Board 1',
          authorEmail: 'test@test.com',
          createdAt: new Date(),
          views: 100,
        },
        {
          id: 2,
          title: 'test2',
          authorEmail: 'test@test.co.kr',
          createdAt: new Date(),
          views: 200,
        },
      ];

      jest
        .spyOn(service as any, 'getStartDate')
        .mockResolvedValueOnce(new Date(0));
      jest
        .spyOn(boardRepository, 'createQueryBuilder')
        .mockImplementation(() => {
          const queryBuilder: any = {
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            take: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            getMany: jest.fn().mockResolvedValue(mockBoards),
          };
          return queryBuilder;
        });

      const result = await service.getList(
        1,
        10,
        'views',
        'ASC',
        'whole',
        'all',
        'Test',
      );

      expect(result).toEqual(mockBoards);
      expect(boardRepository.createQueryBuilder).toHaveBeenCalled();
      expect(service['getStartDate']).toHaveBeenCalledWith('whole');
    });
  });

  describe('getOne', () => {
    it('should find the one board successfully', async () => {
      const boardId = 1;
      const mockBoard = {
        id: boardId,
        title: 'test Board',
        view: 3,
        content: 'test',
        comments: [{ id: 1, content: 'test Comment' }],
        files: [{ id: 1, filename: 'test.jpeg' }],
      };
      const createQueryBuilder: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockBoard),
      };
      const getMockRepository = jest
        .spyOn(dataSource, 'getRepository')
        .mockReturnValue({
          createQueryBuilder: jest.fn(() => createQueryBuilder),
        } as any);
      jest
        .spyOn(service as any, 'increaseView')
        .mockResolvedValueOnce(mockBoard);

      const result = await service.getOne(boardId);

      expect(service['increaseView']).toHaveBeenCalledWith(boardId);
      expect(getMockRepository).toHaveBeenCalledWith(BoardEntity);
      expect(result).toEqual(mockBoard);
    });
  });

  describe('getAuthorByBoardId', () => {
    it('should get author email by boardId successfully', async () => {
      const boardId = 3;
      const mockBoard = {
        id: boardId,
        authorEmail: 'test@test.com',
      } as BoardEntity;
      jest
        .spyOn(boardRepository, 'findOneOrFail')
        .mockResolvedValueOnce(mockBoard);

      const result = await service.getAuthorByBoardId(boardId);

      expect(boardRepository.findOneOrFail).toHaveBeenCalledWith({
        where: { id: boardId },
      });
      expect(result).toEqual(mockBoard.authorEmail);
    });
  });

  describe('removeBoard', () => {
    it('should soft delete board by boardId', async () => {
      const boardId = 4;
      const softDeleted = { affected: 1 } as any;
      jest
        .spyOn(boardRepository, 'softDelete')
        .mockResolvedValueOnce(softDeleted);

      const result = await service.removeBoard(boardId);

      expect(boardRepository.softDelete).toHaveBeenCalledWith(boardId);
      expect(result).toEqual(softDeleted);
    });
  });
});
