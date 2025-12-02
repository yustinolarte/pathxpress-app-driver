-- AlterTable
ALTER TABLE `drivers` ADD COLUMN `emiratesId` VARCHAR(50) NULL,
    ADD COLUMN `emiratesIdExp` DATETIME(3) NULL,
    ADD COLUMN `licenseExp` DATETIME(3) NULL,
    ADD COLUMN `licenseNo` VARCHAR(50) NULL,
    ADD COLUMN `photoUrl` TEXT NULL;
