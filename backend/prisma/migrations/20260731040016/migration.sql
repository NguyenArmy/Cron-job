/*
  Warnings:

  - You are about to drop the column `canCreate` on the `Permission` table. All the data in the column will be lost.
  - You are about to drop the column `canDelete` on the `Permission` table. All the data in the column will be lost.
  - You are about to drop the column `canRead` on the `Permission` table. All the data in the column will be lost.
  - You are about to drop the column `canUpdate` on the `Permission` table. All the data in the column will be lost.
  - You are about to drop the column `roleId` on the `Permission` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `Permission` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `Permission` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Permission" DROP CONSTRAINT "Permission_roleId_fkey";

-- DropIndex
DROP INDEX "Permission_roleId_key";

-- AlterTable
ALTER TABLE "Permission" DROP COLUMN "canCreate",
DROP COLUMN "canDelete",
DROP COLUMN "canRead",
DROP COLUMN "canUpdate",
DROP COLUMN "roleId",
ADD COLUMN     "name" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Permission_name_key" ON "Permission"("name");

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
