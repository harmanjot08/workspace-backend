-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "meetingId" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdBy" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Meeting_meetingId_key" on "Meeting"("meetingId");

-- CreateIndex
CREATE INDEX "Meeting_chatId_idx" on "Meeting"("chatId");

-- CreateIndex
CREATE INDEX "Meeting_status_idx" on "Meeting"("status");