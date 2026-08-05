/*
  Warnings:

  - You are about to drop the column `token` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `permissions_id` on the `Role` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[roleId]` on the table `Permission` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `roleId` to the `Permission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdById` to the `Scheduler` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Account" DROP COLUMN "token",
ADD COLUMN     "refreshTokenHash" TEXT;

-- AlterTable
ALTER TABLE "Permission" ADD COLUMN     "roleId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Role" DROP COLUMN "permissions_id";

-- AlterTable
ALTER TABLE "Scheduler" ADD COLUMN     "createdById" INTEGER NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastRunTime" TIMESTAMP(3),
ADD COLUMN     "nextRunTime" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "TaskAssignment" (
    "id" SERIAL NOT NULL,
    "scheduleId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TaskAssignment_scheduleId_userId_key" ON "TaskAssignment"("scheduleId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_roleId_key" ON "Permission"("roleId");

-- AddForeignKey
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scheduler" ADD CONSTRAINT "Scheduler_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignment" ADD CONSTRAINT "TaskAssignment_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Scheduler"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignment" ADD CONSTRAINT "TaskAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
