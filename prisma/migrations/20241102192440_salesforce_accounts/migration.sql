-- CreateTable
CREATE TABLE "SalesforceAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "site" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "type" TEXT,
    "FirstName" TEXT,
    "LastName" TEXT,
    "Email" TEXT,
    "MobilePhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesforceAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SalesforceAccount_id_key" ON "SalesforceAccount"("id");

-- CreateIndex
CREATE UNIQUE INDEX "SalesforceAccount_userId_key" ON "SalesforceAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SalesforceAccount_accountId_key" ON "SalesforceAccount"("accountId");

-- AddForeignKey
ALTER TABLE "SalesforceAccount" ADD CONSTRAINT "SalesforceAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
