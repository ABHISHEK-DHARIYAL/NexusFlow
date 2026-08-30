import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// Regression test for a confirmed bug: WebSocketServer's subscribed event
// name lists for career coach and company preparation didn't match the
// actual event names emitted by CareerCoachService.ts and
// CompanyPreparationService.ts, so those real-time updates were never
// delivered to any client. This test statically verifies every emitted
// event name for these two services has a matching subscription, as a
// guard against the lists silently drifting apart again.

describe('WebSocketServer subscriptions match actual emitted event names', () => {
  const wsSource = fs.readFileSync(
    path.join(__dirname, '../WebSocketServer.ts'),
    'utf-8'
  );

  function emittedEventNames(servicePath: string, emitterCallPrefix: string): string[] {
    const source = fs.readFileSync(path.join(__dirname, servicePath), 'utf-8');
    const regex = new RegExp(`${emitterCallPrefix}\\.emit\\('([a-z_]+:[a-z_]+)'`, 'g');
    const names = new Set<string>();
    let m;
    while ((m = regex.exec(source))) {
      names.add(m[1]);
    }
    return [...names];
  }

  it('every career_chat/interview event CareerCoachService emits is subscribed to', () => {
    const emitted = emittedEventNames('../../services/CareerCoachService.ts', 'careerEventEmitter');
    expect(emitted.length).toBeGreaterThan(0);
    for (const evt of emitted) {
      expect(wsSource).toContain(`'${evt}'`);
    }
  });

  it('every company_preparation event CompanyPreparationService emits is subscribed to', () => {
    const emitted = emittedEventNames('../../services/CompanyPreparationService.ts', 'jobEventEmitter');
    const companyPrepEvents = emitted.filter((e) => e.startsWith('company_preparation:'));
    expect(companyPrepEvents.length).toBeGreaterThan(0);
    for (const evt of companyPrepEvents) {
      expect(wsSource).toContain(`'${evt}'`);
    }
  });

  it('every task:* event TaskService emits is subscribed to', () => {
    const emitted = emittedEventNames('../../services/TaskService.ts', 'taskEventEmitter');
    expect(emitted.length).toBeGreaterThan(0);
    for (const evt of emitted) {
      expect(wsSource).toContain(`'${evt}'`);
    }
  });
});
