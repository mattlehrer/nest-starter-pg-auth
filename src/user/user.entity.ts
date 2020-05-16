import * as bcrypt from 'bcryptjs';
import { Exclude, Expose } from 'class-transformer';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { v4 as uuid } from 'uuid';

@Exclude()
@Entity()
export class User extends BaseEntity {
  constructor(args: any = {}) {
    super();
    Object.assign(this, args);
  }

  @Expose()
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Expose()
  @Column({ unique: true, default: uuid() })
  username: string;

  @Expose()
  @Column({ unique: true })
  email: string;

  @Column({
    nullable: true,
    transformer: {
      from(value: string): string {
        return value;
      },
      to(value: string): string {
        return bcrypt.hashSync(value, 10);
      },
    },
  })
  password?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ nullable: true })
  google?: string;

  @Column({ type: 'json', nullable: true })
  tokens?: object;

  async validatePassword(password: string): Promise<boolean> {
    return await bcrypt.compare(password, this.password);
  }
}
