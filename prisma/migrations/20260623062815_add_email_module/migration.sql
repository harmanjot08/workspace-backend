-- CreateTable
CREATE TABLE "Email" (
    "id" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isDraft" BOOLEAN NOT NULL DEFAULT false,
    "folder" TEXT NOT NULL DEFAULT 'inbox',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Email_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailRecipient" (
    "id" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "recipientUserId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'to',

    CONSTRAINT "EmailRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Email_fromUserId_idx" ON "Email"("fromUserId");

-- CreateIndex
CREATE INDEX "Email_folder_idx" ON "Email"("folder");

-- CreateIndex
CREATE INDEX "EmailRecipient_emailId_idx" ON "EmailRecipient"("emailId");

-- CreateIndex
CREATE INDEX "EmailRecipient_recipientEmail_idx" ON "EmailRecipient"("recipientEmail");

-- AddForeignKey
ALTER TABLE "Email" ADD CONSTRAINT "Email_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailRecipient" ADD CONSTRAINT "EmailRecipient_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email"("id") ON DELETE CASCADE ON UPDATE CASCADE;
