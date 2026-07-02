-- AlterTable
ALTER TABLE "UserEmail" ADD COLUMN     "importanceScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isImportant" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isScheduled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isSent" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "scheduledFor" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "UserEmail_isScheduled_isSent_scheduledFor_idx" ON "UserEmail"("isScheduled", "isSent", "scheduledFor");
