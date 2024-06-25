import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import { UserType } from '../../shared/types/user-type.enum';
import { Exclude } from 'class-transformer';
import { BoardEntity } from 'src/boards/entities/board.entity';
import { BaseTimeEntity } from 'src/shared/entities/baseTime.entity';
import { CommentEntity } from 'src/comments/entities/comment.entity';
import { FileEntity } from 'src/files/entities/files.entity';

@Entity('User')
export class UserEntity extends BaseTimeEntity {
  @PrimaryColumn()
  id: string;

  @Column({ unique: true, length: 60 })
  email: string;

  @Column({ length: 60 })
  hashedPassword: string;

  @Column({ type: 'enum', enum: UserType, default: UserType.Member })
  type: UserType;

  @Column({ nullable: true })
  @Exclude()
  hashedRefreshToken: string;

  @OneToMany(() => BoardEntity, (board) => board.author)
  boards: BoardEntity[];

  @OneToMany(() => CommentEntity, (comment) => comment.author)
  comments: CommentEntity[];

  @OneToMany(() => FileEntity, (file) => file.owner)
  files: FileEntity[];
}
