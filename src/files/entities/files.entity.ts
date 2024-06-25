import { BaseTimeEntity } from 'src/shared/entities/baseTime.entity';
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BoardEntity } from 'src/boards/entities/board.entity';
import { UserEntity } from 'src/users/entities/user.entity';
@Entity('File')
export class FileEntity extends BaseTimeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  url: string;

  @Column()
  key: string;

  @ManyToOne(() => BoardEntity, (board) => board.files, { nullable: false })
  board: BoardEntity;

  @ManyToOne(() => UserEntity, (user) => user.files, { nullable: false })
  @JoinColumn({ referencedColumnName: 'email' })
  owner: UserEntity;

  @Column({ nullable: false })
  ownerEmail: string;
}
