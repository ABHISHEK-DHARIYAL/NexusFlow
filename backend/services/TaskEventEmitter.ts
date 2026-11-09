import { EventEmitter } from 'events';

export class TaskEventEmitter extends EventEmitter {}

export const taskEventEmitter = new TaskEventEmitter();
