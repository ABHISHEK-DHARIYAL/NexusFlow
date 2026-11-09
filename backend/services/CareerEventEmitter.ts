import { EventEmitter } from 'events';

class CareerEventEmitter extends EventEmitter {}

export const careerEventEmitter = new CareerEventEmitter();
