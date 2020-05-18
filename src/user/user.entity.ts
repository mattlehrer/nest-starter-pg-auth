import * as bcrypt from 'bcryptjs';
import { Exclude, Expose } from 'class-transformer';
import { Role } from 'src/shared/interfaces/roles.enum';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { fromHash, toHash } from './password.transformer';

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
  @Column({ unique: true })
  username: string;

  @Expose()
  @Column({ unique: true })
  email: string;

  @Column({
    nullable: true,
    transformer: {
      from: fromHash,
      to: toHash,
    },
  })
  password?: string;

  @Column({
    type: 'enum',
    enum: Role,
    enumName: 'role',
    array: true,
    default: [Role.USER],
  })
  roles: Role[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ nullable: true })
  google?: string;

  @Column('json', { nullable: true })
  tokens?: object;

  async validatePassword(password: string): Promise<boolean> {
    return await bcrypt.compare(password, this.password);
  }
}
