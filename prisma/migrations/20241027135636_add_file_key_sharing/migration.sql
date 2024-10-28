/*
  Warnings:

  - Added the required column `private_key` to the `Users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `public_key` to the `Users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ShareStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REVOKED');

-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "private_key" TEXT NOT NULL,
ADD COLUMN     "public_key" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "SharedAccess" (
    "id" SERIAL NOT NULL,
    "owner_id" INTEGER NOT NULL,
    "requester_id" INTEGER NOT NULL,
    "file_id" INTEGER NOT NULL,
    "encrypted_key" TEXT NOT NULL,
    "public_key_used" TEXT NOT NULL,
    "status" "ShareStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SharedAccess_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SharedAccess" ADD CONSTRAINT "SharedAccess_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedAccess" ADD CONSTRAINT "SharedAccess_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedAccess" ADD CONSTRAINT "SharedAccess_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "Files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
