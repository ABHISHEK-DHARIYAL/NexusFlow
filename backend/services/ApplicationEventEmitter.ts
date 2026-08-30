import { EventEmitter } from 'events';
import { logger } from '../logger';

export class ApplicationEventEmitter extends EventEmitter {}

export const applicationEventEmitter = new ApplicationEventEmitter();

applicationEventEmitter.on('application:created', (data) => {
  logger?.system?.info?.(`[Application Event] Created application ${data.applicationId} for user ${data.userId}`);
});

applicationEventEmitter.on('application:status_changed', (data) => {
  logger?.system?.info?.(
    `[Application Event] Status changed for app ${data.applicationId} from ${data.oldStatus} to ${data.newStatus}`
  );
});

applicationEventEmitter.on('application:event_added', (data) => {
  logger?.system?.info?.(`[Application Event] Added event to app ${data.applicationId}`);
});

applicationEventEmitter.on('application:followup_due', (data) => {
  logger?.system?.info?.(`[Application Event] Follow-up due for app ${data.applicationId}`);
});
