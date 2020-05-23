import { randomBytes } from 'crypto';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity()
export class EmailToken extends BaseEntity {
  constructor(user: User) {
    super();
    this.user = user;
    this.code = randomBytes(32).toString('hex');
  }

  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 75,
    unique: true,
  })
  code: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: true })
  user: User;

  @CreateDateColumn()
  created_at: Date;

  isStillValid(): boolean {
    // valid for 1 day
    return (
      this.created_at.getTime() > new Date().getTime() - 24 * 60 * 60 * 1000
    );
  }
}
