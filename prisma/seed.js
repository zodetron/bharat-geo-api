const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const india = await prisma.country.upsert({
    where: { isoCode: "IND" },
    update: {},
    create: {
      name: "India",
      isoCode: "IND",
    },
  });

  console.log(`Country seeded: ${india.name} (id=${india.id})`);
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
