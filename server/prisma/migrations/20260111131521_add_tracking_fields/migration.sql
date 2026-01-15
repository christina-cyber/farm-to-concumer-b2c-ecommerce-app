-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "currentLat" DOUBLE PRECISION,
ADD COLUMN     "currentLong" DOUBLE PRECISION,
ADD COLUMN     "lastLocationUpdate" TIMESTAMP(3);
