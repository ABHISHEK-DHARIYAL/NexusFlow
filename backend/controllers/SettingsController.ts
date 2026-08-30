import { Request, Response } from 'express';
import { userSettingsRepository } from '../repositories/UserSettingsRepository';
import { UnauthorizedError } from '../utils/errors';

function toFrontendShape(settings: any) {
  return {
    emailNotifications: settings.emailNotifications,
    theme: settings.theme,
    // autoRetryFailedTasks has no backing column in UserSettings and is
    // not persisted server-side; the frontend keeps its own local
    // default for this one field until a real column exists for it.
    autoRetryFailedTasks: true,
  };
}

export class SettingsController {
  getSettings = async (req: Request, res: Response) => {
    if (!req.user?.id) {
      throw new UnauthorizedError('Authentication required');
    }
    const settings = await userSettingsRepository.getOrCreate(req.user.id);
    res.json({ success: true, data: toFrontendShape(settings) });
  };

  updateSettings = async (req: Request, res: Response) => {
    if (!req.user?.id) {
      throw new UnauthorizedError('Authentication required');
    }
    const { theme, emailNotifications } = req.body || {};
    const updated = await userSettingsRepository.update(req.user.id, {
      ...(theme !== undefined && { theme }),
      ...(emailNotifications !== undefined && { emailNotifications }),
    });
    res.json({ success: true, data: toFrontendShape(updated) });
  };
}
