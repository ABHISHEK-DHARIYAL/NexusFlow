import { EventEmitter } from 'events';

class JobEventEmitter extends EventEmitter {}

export const jobEventEmitter = new JobEventEmitter();
