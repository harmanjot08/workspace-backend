-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "renewalDate" TIMESTAMP(3),
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active';

-- CreateTable
CREATE TABLE "pricing_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "billingCycle" TEXT NOT NULL DEFAULT 'monthly',
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "maxUsers" INTEGER,
    "maxStorage" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_plans_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "pricing_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
