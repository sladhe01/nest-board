import { BaseTimeEntity } from 'src/shared/entities/baseTime.entity';
import { UserEntity } from 'src/users/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BoardEntity } from '../../boards/entities/board.entity';

@Entity('Comment')
export class CommentEntity extends BaseTimeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  content: string;

  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ referencedColumnName: 'email' })
  author: UserEntity;

  @Column({ nullable: false })
  authorEmail: string;

  @ManyToOne(() => BoardEntity, (board) => board.comments, { nullable: false })
  board: BoardEntity;

  @Column({ nullable: false })
  boardId: number;

  @ManyToOne(() => CommentEntity, (comment) => comment.replies)
  parentComment: CommentEntity;

  @Column({ nullable: true })
  parentCommentId: number;

  @OneToMany(() => CommentEntity, (comment) => comment.parentComment, {
    cascade: ['soft-remove'],
  })
  replies: CommentEntity[];
}
