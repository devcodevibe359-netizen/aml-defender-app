-- CreateTable
CREATE TABLE "KycVerification" (
    "id" TEXT NOT NULL,
    "orderIdentityId" TEXT NOT NULL,
    "kycToken" TEXT NOT NULL,
    "kycStatus" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KycVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KycVerification_orderIdentityId_key" ON "KycVerification"("orderIdentityId");

-- CreateIndex
CREATE UNIQUE INDEX "KycVerification_kycToken_key" ON "KycVerification"("kycToken");
