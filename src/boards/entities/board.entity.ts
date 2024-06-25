import { UserEntity } from 'src/users/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BoardCategory } from '../board-category.enum';
import { BaseTimeEntity } from 'src/shared/entities/baseTime.entity';
import { CommentEntity } from '../../comments/entities/comment.entity';
import { FileEntity } from 'src/files/entities/files.entity';

@Entity('Board')
export class BoardEntity extends BaseTimeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  title: string;

  @Column({ nullable: true, default: null })
  content: string;

  @ManyToOne(() => UserEntity, (author) => author.boards, { nullable: false })
  @JoinColumn({ referencedColumnName: 'email' })
  author: UserEntity;

  @Column({ nullable: false })
  authorEmail: string;

  @Column({ type: 'enum', enum: BoardCategory, nullable: false })
  category: BoardCategory;

  @OneToMany(() => CommentEntity, (comment) => comment.board, {
    cascade: ['soft-remove'],
  })
  comments: CommentEntity[];

  @OneToMany(() => FileEntity, (image) => image.board, {
    cascade: ['soft-remove'],
  })
  files: FileEntity[];

  @Column({ type: 'int', default: 0 })
  views: number;
}
