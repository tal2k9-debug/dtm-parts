-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "businessName" TEXT,
    "businessAddress" TEXT,
    "businessId" TEXT,
    "businessType" TEXT,
    "role" TEXT NOT NULL DEFAULT 'CUSTOMER',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLogin" DATETIME
);

-- CreateTable
CREATE TABLE "QuoteRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "guestName" TEXT,
    "guestPhone" TEXT,
    "carMake" TEXT NOT NULL,
    "carModel" TEXT NOT NULL,
    "carYear" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "notes" TEXT,
    "imageUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "quotedPrice" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" DATETIME,
    CONSTRAINT "QuoteRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT NOT NULL,
    "userId" TEXT,
    "senderRole" TEXT NOT NULL,
    "content" TEXT,
    "imageUrl" TEXT,
    "readAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "QuoteRequest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Message_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BumperCache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mondayItemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "carMake" TEXT NOT NULL,
    "carModel" TEXT NOT NULL,
    "carYear" TEXT NOT NULL,
    "position" TEXT,
    "price" REAL,
    "status" TEXT NOT NULL,
    "imageUrl" TEXT,
    "lastSynced" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "BumperCache_mondayItemId_key" ON "BumperCache"("mondayItemId");
