import { Test, TestingModule } from '@nestjs/testing';
import { FilesService } from './files.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FileEntity } from './entities/files.entity';
import { Repository } from 'typeorm';
import { s3Config } from 'src/config/s3Config';
import * as AWS from '@aws-sdk/client-s3';
import { BoardEntity } from 'src/boards/entities/board.entity';

jest.mock('@aws-sdk/client-s3');
const s3 = new AWS.S3();
s3.putObject = jest.fn().mockImplementation((params, callback) => {
  callback(null, 'Success');
});

describe('FilesService', () => {
  let service: FilesService;
  let fileRepository: Repository<FileEntity>;

  const mockS3Config = {
    region: 'us-east-2',
    accessKeyId: 'mockAccessKeyId',
    secretAccessKey: 'mockSecretAccessKey',
    bucketName: 'mockBucketName',
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        {
          provide: getRepositoryToken(FileEntity),
          useValue: { save: jest.fn(), findOneByOrFail: jest.fn() },
        },
        {
          provide: s3Config.KEY,
          useValue: mockS3Config,
        },
      ],
    }).compile();

    service = module.get<FilesService>(FilesService);
    fileRepository = module.get(getRepositoryToken(FileEntity));
  });
  describe('uploadFiles', () => {
    it('sholud upload files successfully', async () => {
      const s3 = new AWS.S3() as any;
      s3.putObjectCommand = jest.fn().mockImplementation((params, callback) => {
        callback(null, 'Success');
      });
      const files = [
        { filename: 'file1' },
        { filename: 'file2' },
      ] as Express.Multer.File[];
      const board = { id: 1 } as BoardEntity;
      jest.spyOn(fileRepository, 'save').mockResolvedValueOnce({} as any);

      await service.uploadFiles(files, board);

      expect(fileRepository.save).toHaveBeenCalledTimes(2);
    });
  });

  describe('getFilesOwnerById', () => {
    it('should return ownerEmail by fileId', async () => {
      const fileId = 1;
      const mockFile = { id: fileId, ownerEmail: 'test@test.com' };

      jest
        .spyOn(fileRepository, 'findOneByOrFail')
        .mockResolvedValueOnce(mockFile as any);

      const ownerEmail = await service.getFilesOwnerById(fileId);

      expect(fileRepository.findOneByOrFail).toHaveBeenCalledWith({
        id: fileId,
      });
      expect(ownerEmail).toBe(mockFile.ownerEmail);
    });
  });
});
