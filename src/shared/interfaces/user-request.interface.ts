import { Request } from 'express';
import { User } from 'src/user/user.entity';

export interface IUserRequest extends Request {
  user: User;
}
