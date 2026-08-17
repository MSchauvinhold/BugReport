-- AlterTable
ALTER TABLE "TestCase" ADD COLUMN     "actualResult" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "environment" TEXT,
ADD COLUMN     "executedAt" TIMESTAMP(3),
ADD COLUMN     "module" TEXT,
ADD COLUMN     "priority" TEXT,
ADD COLUMN     "screenshots" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "severity" TEXT,
ADD COLUMN     "testData" TEXT NOT NULL DEFAULT '';
