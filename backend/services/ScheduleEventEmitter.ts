import { EventEmitter } from 'events';
import { logger } from '../logger';

export class ScheduleEventEmitter extends EventEmitter {}

export const scheduleEventEmitter = new ScheduleEventEmitter();

scheduleEventEmitter.on('schedule:created', (data) => {
  logger?.system?.info?.(`[Schedule Event] Created schedule ${data.scheduleId} (${data.name}) for user ${data.userId}`);
});

scheduleEventEmitter.on('schedule:updated', (data) => {
  logger?.system?.info?.(`[Schedule Event] Updated schedule ${data.scheduleId} for user ${data.userId}`);
});

scheduleEventEmitter.on('schedule:started', (data) => {
  logger?.system?.info?.(`[Schedule Event] Started execution for schedule ${data.scheduleId} (Execution ID: ${data.executionId})`);
});

scheduleEventEmitter.on('schedule:completed', (data) => {
  logger?.system?.info?.(`[Schedule Event] Completed execution for schedule ${data.scheduleId} in ${data.durationMs}ms`);
});

scheduleEventEmitter.on('schedule:failed', (data) => {
  logger?.system?.warn?.(`[Schedule Event] Failed execution for schedule ${data.scheduleId}: ${data.error}`);
});

scheduleEventEmitter.on('schedule:skipped', (data) => {
  logger?.system?.info?.(`[Schedule Event] Skipped execution for schedule ${data.scheduleId}: ${data.reason}`);
});

scheduleEventEmitter.on('schedule:disabled', (data) => {
  logger?.system?.info?.(`[Schedule Event] Schedule disabled ${data.scheduleId}`);
});
