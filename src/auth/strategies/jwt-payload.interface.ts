import { Role } from 'src/shared/interfaces/roles.enum';

export interface JwtPayload {
  username: string;
  sub: number;
  roles: Role[];
}
