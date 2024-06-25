import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { s3Config } from 'src/config/s3Config';
import { BadRequestException } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { InjectRepository } from '@nestjs/typeorm';
import { FileEntity } from './entities/files.entity';
import { Repository } from 'typeorm';
import { BoardEntity } from 'src/boards/entities/board.entity';

@Injectable()
export class FilesService {
  constructor(
    @Inject(s3Config.KEY) private config: ConfigType<typeof s3Config>,
    @InjectRepository(FileEntity)
    private fileRepository: Repository<FileEntity>,
  ) {
    this.s3Client = new S3Client({
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
    });
  }
  private s3Client: S3Client;

  async uploadFiles(files: Express.Multer.File[], board: BoardEntity) {
    if (files.length === 0) throw new BadRequestException('No file');

    const fileInfos = [];
    const promises = files.map(async (file) => {
      const key = `${Date.now().toString()}-${file.originalname}`;
      const body = file.buffer;
      const command = new PutObjectCommand({
        Key: key,
        Body: body,
        Bucket: this.config.bucketName,
      });
      await this.s3Client.send(command);
      const fileInfo = {
        url: `https://s3.${this.config.region}.amazonaws.com/${this.config.bucketName}/${key}`,
        key,
      };
      this.fileRepository.save({ ...fileInfo, board });
      fileInfos.push(fileInfo);
    });
    await Promise.all(promises);

    return fileInfos;
  }

  async getFilesOwnerById(id: number) {
    const file = await this.fileRepository.findOneByOrFail({ id });
    return file.ownerEmail;
  }
}
