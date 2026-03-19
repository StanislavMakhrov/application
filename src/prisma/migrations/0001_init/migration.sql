-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "branche" TEXT NOT NULL,
    "mitarbeiter" INTEGER NOT NULL,
    "standort" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "energy_entries" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "strom_kwh" DOUBLE PRECISION NOT NULL,
    "erdgas_m3" DOUBLE PRECISION NOT NULL,
    "diesel_l" DOUBLE PRECISION NOT NULL,
    "heizoel_l" DOUBLE PRECISION NOT NULL,
    "co2_scope1_t" DOUBLE PRECISION NOT NULL,
    "co2_scope2_t" DOUBLE PRECISION NOT NULL,
    "co2_total_t" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "energy_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "companies_user_id_key" ON "companies"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "energy_entries_company_id_year_key" ON "energy_entries"("company_id", "year");

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "energy_entries" ADD CONSTRAINT "energy_entries_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
