import { EventEmitter } from 'events';
import { StrictEventEmitter } from 'nest-emitter';
import { User } from './user.entity';

interface UserEvents {
  newUser: User;
}

export type UserEventEmitter = StrictEventEmitter<EventEmitter, UserEvents>;
