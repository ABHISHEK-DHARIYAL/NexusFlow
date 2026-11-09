import bcrypt from 'bcryptjs';

// 12 rounds is a reasonable default: strong enough for password storage,
// fast enough to not noticeably slow down login on modest hardware.
const SALT_ROUNDS = 12;

export const hashPassword = async (plainTextPassword: string): Promise<string> => {
  return bcrypt.hash(plainTextPassword, SALT_ROUNDS);
};

export const comparePassword = async (
  plainTextPassword: string,
  passwordHash: string
): Promise<boolean> => {
  return bcrypt.compare(plainTextPassword, passwordHash);
};
