-- Allow accounts to be created via email + password, with GitHub connected
-- later instead of required at signup time.

-- githubId becomes optional: existing unique index stays (MySQL unique
-- indexes allow multiple NULLs), we just relax the NOT NULL constraint.
ALTER TABLE `users` MODIFY COLUMN `githubId` VARCHAR(191) NULL;

-- New column to hold a bcrypt hash for accounts created with email + password.
-- NULL for accounts that only ever used "Continue with GitHub".
ALTER TABLE `users` ADD COLUMN `passwordHash` VARCHAR(191) NULL;
