-- AlterTable
ALTER TABLE "chats" ADD COLUMN "isPinned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "pinnedBy" TEXT;