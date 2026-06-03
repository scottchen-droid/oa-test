/*
  Warnings:

  - You are about to drop the column `isSuperAdmin` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "regions" ADD COLUMN     "defaultLocale" VARCHAR(10) NOT NULL DEFAULT 'zh-TW';

-- AlterTable
ALTER TABLE "users" DROP COLUMN "isSuperAdmin";
