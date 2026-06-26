-- CreateTable
CREATE TABLE "StarredEmail" (
    "id" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StarredEmail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StarredEmail_userId_idx" ON "StarredEmail"("userId");

-- CreateIndex
CREATE INDEX "StarredEmail_emailId_idx" ON "StarredEmail"("emailId");

-- CreateIndex
CREATE UNIQUE INDEX "StarredEmail_emailId_userId_key" ON "StarredEmail"("emailId", "userId");

-- AddForeignKey
ALTER TABLE "StarredEmail" ADD CONSTRAINT "StarredEmail_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StarredEmail" ADD CONSTRAINT "StarredEmail_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
