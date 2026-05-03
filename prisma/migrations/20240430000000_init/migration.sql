-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'CLIENT');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ApiPlan" AS ENUM ('FREE', 'PREMIUM', 'PRO', 'UNLIMITED');

-- CreateTable
CREATE TABLE "countries" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "isoCode" VARCHAR(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "states" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "censusCode" VARCHAR(10) NOT NULL,
    "countryId" INTEGER NOT NULL,

    CONSTRAINT "states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "districts" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "censusCode" VARCHAR(10) NOT NULL,
    "stateId" INTEGER NOT NULL,

    CONSTRAINT "districts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sub_districts" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "censusCode" VARCHAR(10) NOT NULL,
    "districtId" INTEGER NOT NULL,

    CONSTRAINT "sub_districts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "villages" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "censusCode" VARCHAR(10) NOT NULL,
    "subDistrictId" INTEGER NOT NULL,
    "totalPopulation" INTEGER,
    "malePopulation" INTEGER,
    "femalePopulation" INTEGER,
    "totalHouseholds" INTEGER,

    CONSTRAINT "villages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "fullName" VARCHAR(150) NOT NULL,
    "company" VARCHAR(150),
    "role" "UserRole" NOT NULL DEFAULT 'CLIENT',
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" SERIAL NOT NULL,
    "keyPrefix" VARCHAR(16) NOT NULL,
    "secretHash" VARCHAR(255) NOT NULL,
    "plan" "ApiPlan" NOT NULL DEFAULT 'FREE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_logs" (
    "id" BIGSERIAL NOT NULL,
    "endpoint" VARCHAR(255) NOT NULL,
    "method" VARCHAR(10) NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "responseTime" INTEGER NOT NULL,
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,
    "userId" INTEGER,
    "apiKeyId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "countries_name_key" ON "countries"("name");
CREATE UNIQUE INDEX "countries_isoCode_key" ON "countries"("isoCode");

CREATE UNIQUE INDEX "states_censusCode_countryId_key" ON "states"("censusCode", "countryId");
CREATE INDEX "states_countryId_idx" ON "states"("countryId");
CREATE INDEX "states_name_idx" ON "states"("name");

CREATE UNIQUE INDEX "districts_censusCode_stateId_key" ON "districts"("censusCode", "stateId");
CREATE INDEX "districts_stateId_idx" ON "districts"("stateId");
CREATE INDEX "districts_name_idx" ON "districts"("name");

CREATE UNIQUE INDEX "sub_districts_censusCode_districtId_key" ON "sub_districts"("censusCode", "districtId");
CREATE INDEX "sub_districts_districtId_idx" ON "sub_districts"("districtId");
CREATE INDEX "sub_districts_name_idx" ON "sub_districts"("name");

CREATE UNIQUE INDEX "villages_censusCode_subDistrictId_key" ON "villages"("censusCode", "subDistrictId");
CREATE INDEX "villages_subDistrictId_idx" ON "villages"("subDistrictId");
CREATE INDEX "villages_name_idx" ON "villages"("name");

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "users_status_idx" ON "users"("status");

CREATE UNIQUE INDEX "api_keys_keyPrefix_key" ON "api_keys"("keyPrefix");
CREATE INDEX "api_keys_userId_idx" ON "api_keys"("userId");
CREATE INDEX "api_keys_isActive_idx" ON "api_keys"("isActive");

CREATE INDEX "api_logs_apiKeyId_idx" ON "api_logs"("apiKeyId");
CREATE INDEX "api_logs_userId_idx" ON "api_logs"("userId");
CREATE INDEX "api_logs_createdAt_idx" ON "api_logs"("createdAt");
CREATE INDEX "api_logs_endpoint_idx" ON "api_logs"("endpoint");

-- AddForeignKey
ALTER TABLE "states" ADD CONSTRAINT "states_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "districts" ADD CONSTRAINT "districts_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "states"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sub_districts" ADD CONSTRAINT "sub_districts_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "districts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "villages" ADD CONSTRAINT "villages_subDistrictId_fkey" FOREIGN KEY ("subDistrictId") REFERENCES "sub_districts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "api_logs" ADD CONSTRAINT "api_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "api_logs" ADD CONSTRAINT "api_logs_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "api_keys"("id") ON DELETE SET NULL ON UPDATE CASCADE;
