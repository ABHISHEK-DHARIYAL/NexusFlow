import { prisma } from '../lib/prisma';

/**
 * Fix for a confirmed bug: frontend/services/settings.service.ts calls
 * GET/PUT /v1/settings expecting real persistence, but no backend route
 * ever existed for it - every settings change silently never persisted
 * (the frontend's try/catch fallback just echoed back what was sent,
 * giving a false impression of success). The Prisma schema already
 * defines a real UserSettings model; nothing in the backend used it.
 */
export class UserSettingsRepository {
  async getOrCreate(userId: string) {
    const existing = await prisma.userSettings.findUnique({ where: { userId } });
    if (existing) return existing;
    return prisma.userSettings.create({ data: { userId } });
  }

  async update(userId: string, data: { theme?: string; emailNotifications?: boolean }) {
    return prisma.userSettings.upsert({
      where: { userId },
      create: { userId, ...data },
      update: { ...data },
    });
  }
}

export const userSettingsRepository = new UserSettingsRepository();
