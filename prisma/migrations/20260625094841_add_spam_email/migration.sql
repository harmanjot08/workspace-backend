-- AlterTable
ALTER TABLE "Email" ADD COLUMN     "isSpam" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Email_isSpam_idx" ON "Email"("isSpam");
