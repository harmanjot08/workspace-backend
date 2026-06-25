-- AlterTable
ALTER TABLE "Email" ADD COLUMN     "isPromotion" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Email_isPromotion_idx" ON "Email"("isPromotion");
