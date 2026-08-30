import { EventEmitter } from 'events';

export class LeetCodeEventEmitter extends EventEmitter {}

export const leetCodeEventEmitter = new LeetCodeEventEmitter();
