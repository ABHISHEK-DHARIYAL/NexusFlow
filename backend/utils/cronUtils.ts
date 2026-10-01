/**
 * Cron & Schedule Time Utilities for NexusFlow Scheduler
 */

export function validateCronExpression(cron: string): boolean {
  if (!cron || typeof cron !== 'string') return false;
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return false;

  const patterns = [
    /^(\*|([0-5]?\d)(-[0-5]?\d)?(\/[1-5]?\d)?)(,(\*|([0-5]?\d)(-[0-5]?\d)?(\/[1-5]?\d)?))*$/, // minute: 0-59
    /^(\*|([0-1]?\d|2[0-3])(-([0-1]?\d|2[0-3]))?(\/[1-2]?\d)?)(,(\*|([0-1]?\d|2[0-3])(-([0-1]?\d|2[0-3]))?(\/[1-2]?\d)?))*$/, // hour: 0-23
    /^(\*|([1-9]|[12]\d|3[01])(-([1-9]|[12]\d|3[01]))?(\/[1-3]?\d)?)(,(\*|([1-9]|[12]\d|3[01])(-([1-9]|[12]\d|3[01]))?(\/[1-3]?\d)?))*$/, // day of month: 1-31
    /^(\*|([1-9]|1[0-2])(-([1-9]|1[0-2]))?(\/[1-1]?\d)?)(,(\*|([1-9]|1[0-2])(-([1-9]|1[0-2]))?(\/[1-1]?\d)?))*$/, // month: 1-12
    /^(\*|[0-6](-[0-6])?(\/[1-6])?)(,(\*|[0-6](-[0-6])?(\/[1-6])?))*$/, // day of week: 0-6 (0=Sun)
  ];

  for (let i = 0; i < 5; i++) {
    if (!patterns[i].test(parts[i])) {
      return false;
    }
  }

  return true;
}

export function isValidTimezone(tz: string): boolean {
  if (!tz || typeof tz !== 'string') return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export interface NextRunParams {
  frequency: string;
  schedule?: string | null;
  time?: string | null;
  timezone?: string | null;
  fromDate?: Date;
}

export function calculateNextRunAt(params: NextRunParams): Date {
  const timezone = isValidTimezone(params.timezone || '') ? params.timezone! : 'UTC';
  const baseDate = params.fromDate || new Date();
  const frequency = (params.frequency || 'DAILY').toUpperCase();
  const timeStr = params.time || '09:00';

  const [targetHour, targetMinute] = parseTimeStr(timeStr);

  if (frequency === 'DAILY') {
    return getNextDailyRun(baseDate, targetHour, targetMinute, timezone);
  }

  if (frequency === 'WEEKLY') {
    return getNextWeeklyRun(baseDate, targetHour, targetMinute, timezone);
  }

  if (frequency === 'MONTHLY') {
    return getNextMonthlyRun(baseDate, targetHour, targetMinute, timezone);
  }

  if (frequency === 'CUSTOM_CRON' && params.schedule && validateCronExpression(params.schedule)) {
    return getNextCronRun(baseDate, params.schedule, timezone);
  }

  if (frequency === 'INTERVAL') {
    const intervalMs = parseIntervalToMs(params.schedule || '24h');
    return new Date(baseDate.getTime() + intervalMs);
  }

  // Fallback default: +24h
  return getNextDailyRun(baseDate, targetHour, targetMinute, timezone);
}

function parseTimeStr(timeStr: string): [number, number] {
  if (!timeStr || !timeStr.includes(':')) return [9, 0];
  const [h, m] = timeStr.split(':').map((s) => parseInt(s, 10));
  const hour = isNaN(h) || h < 0 || h > 23 ? 9 : h;
  const minute = isNaN(m) || m < 0 || m > 59 ? 0 : m;
  return [hour, minute];
}

function parseIntervalToMs(schedule: string): number {
  const match = schedule.trim().match(/^(\d+)\s*([mhdw])$/i);
  if (!match) return 24 * 3600 * 1000;
  const val = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  switch (unit) {
    case 'm':
      return val * 60 * 1000;
    case 'h':
      return val * 3600 * 1000;
    case 'd':
      return val * 24 * 3600 * 1000;
    case 'w':
      return val * 7 * 24 * 3600 * 1000;
    default:
      return 24 * 3600 * 1000;
  }
}

function getZonedParts(date: Date, timezone: string) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const map: Record<string, number> = {};
  for (const p of parts) {
    if (p.type !== 'literal') {
      map[p.type] = parseInt(p.value, 10);
    }
  }

  return {
    year: map.year,
    month: map.month, // 1-12
    day: map.day,
    hour: map.hour === 24 ? 0 : map.hour,
    minute: map.minute,
    second: map.second,
  };
}

function getNextDailyRun(baseDate: Date, hour: number, minute: number, timezone: string): Date {
  const currentZoned = getZonedParts(baseDate, timezone);

  // Compare hour/minute in target timezone
  let daysToAdd = 0;
  if (
    currentZoned.hour > hour ||
    (currentZoned.hour === hour && currentZoned.minute >= minute)
  ) {
    daysToAdd = 1;
  }

  // Create candidate UTC timestamp corresponding to target zoned time
  const candidateYear = currentZoned.year;
  const candidateMonth = currentZoned.month - 1; // 0-indexed
  const candidateDay = currentZoned.day + daysToAdd;

  const targetDate = new Date(Date.UTC(candidateYear, candidateMonth, candidateDay, hour, minute, 0, 0));
  
  // Refine offset adjustment
  return adjustTimezoneOffset(targetDate, hour, minute, timezone);
}

function getNextWeeklyRun(baseDate: Date, hour: number, minute: number, timezone: string): Date {
  // Weekly run defaults to Monday
  const currentZoned = getZonedParts(baseDate, timezone);
  const dayOfWeek = new Date(Date.UTC(currentZoned.year, currentZoned.month - 1, currentZoned.day)).getUTCDay(); // 0=Sun, 1=Mon...
  
  let daysUntilMonday = (1 - dayOfWeek + 7) % 7;
  if (
    daysUntilMonday === 0 &&
    (currentZoned.hour > hour || (currentZoned.hour === hour && currentZoned.minute >= minute))
  ) {
    daysUntilMonday = 7;
  }

  const targetDate = new Date(
    Date.UTC(currentZoned.year, currentZoned.month - 1, currentZoned.day + daysUntilMonday, hour, minute, 0, 0)
  );

  return adjustTimezoneOffset(targetDate, hour, minute, timezone);
}

function getNextMonthlyRun(baseDate: Date, hour: number, minute: number, timezone: string): Date {
  const currentZoned = getZonedParts(baseDate, timezone);
  
  let year = currentZoned.year;
  let month = currentZoned.month; // 1-12
  
  if (
    currentZoned.day > 1 ||
    (currentZoned.day === 1 && (currentZoned.hour > hour || (currentZoned.hour === hour && currentZoned.minute >= minute)))
  ) {
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  const targetDate = new Date(Date.UTC(year, month - 1, 1, hour, minute, 0, 0));
  return adjustTimezoneOffset(targetDate, hour, minute, timezone);
}

function adjustTimezoneOffset(utcDate: Date, targetHour: number, targetMinute: number, timezone: string): Date {
  let result = new Date(utcDate.getTime());
  for (let i = 0; i < 3; i++) {
    const zoned = getZonedParts(result, timezone);
    const diffHours = targetHour - zoned.hour;
    const diffMins = targetMinute - zoned.minute;
    if (diffHours === 0 && diffMins === 0) break;
    result = new Date(result.getTime() + (diffHours * 3600 + diffMins * 60) * 1000);
  }
  return result;
}

function getNextCronRun(baseDate: Date, cronStr: string, timezone: string): Date {
  const parts = cronStr.trim().split(/\s+/);
  const [minRule, hourRule, domRule, monthRule, dowRule] = parts;

  // Step minute by minute starting from baseDate + 1 min up to 366 days
  let current = new Date(baseDate.getTime() + 60 * 1000);
  current.setSeconds(0, 0);

  const maxSteps = 366 * 24 * 60; // Max 1 year in minutes
  for (let step = 0; step < maxSteps; step++) {
    const zoned = getZonedParts(current, timezone);
    const dateObj = new Date(Date.UTC(zoned.year, zoned.month - 1, zoned.day));
    const dayOfWeek = dateObj.getUTCDay(); // 0-6

    if (
      matchCronField(minRule, zoned.minute, 0, 59) &&
      matchCronField(hourRule, zoned.hour, 0, 23) &&
      matchCronField(domRule, zoned.day, 1, 31) &&
      matchCronField(monthRule, zoned.month, 1, 12) &&
      matchCronField(dowRule, dayOfWeek, 0, 6)
    ) {
      return current;
    }

    current = new Date(current.getTime() + 60 * 1000);
  }

  // Fallback to +24h
  return new Date(baseDate.getTime() + 24 * 3600 * 1000);
}

function matchCronField(rule: string, val: number, minVal: number, maxVal: number): boolean {
  if (rule === '*') return true;

  const items = rule.split(',');
  for (const item of items) {
    if (item.includes('/')) {
      const [range, stepStr] = item.split('/');
      const step = parseInt(stepStr, 10);
      let start = minVal;
      let end = maxVal;
      if (range !== '*') {
        if (range.includes('-')) {
          const [s, e] = range.split('-').map((x) => parseInt(x, 10));
          start = s;
          end = e;
        } else {
          start = parseInt(range, 10);
        }
      }
      if (val >= start && val <= end && (val - start) % step === 0) {
        return true;
      }
    } else if (item.includes('-')) {
      const [start, end] = item.split('-').map((x) => parseInt(x, 10));
      if (val >= start && val <= end) return true;
    } else {
      if (parseInt(item, 10) === val) return true;
    }
  }

  return false;
}
