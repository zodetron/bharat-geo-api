/**
 * Creates an ADMIN user interactively.
 * Usage: node scripts/create-admin.js
 */

require("dotenv").config();
const readline = require("readline");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((res) => rl.question(q, res));

async function main() {
  console.log("\n── Bharat Geo API Admin User Setup ──────────────────\n");

  const email    = (await ask("Email:     ")).trim().toLowerCase();
  const fullName = (await ask("Full name: ")).trim();
  const company  = (await ask("Company (optional, press Enter to skip): ")).trim();
  const password = (await ask("Password:  ")).trim();

  if (!email || !fullName || !password) {
    console.error("\n[error] email, full name and password are required.");
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("\n[error] Password must be at least 8 characters.");
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // Upgrade existing user to ADMIN + ACTIVE instead of failing
    const updated = await prisma.user.update({
      where: { email },
      data: {
        passwordHash: await bcrypt.hash(password, 12),
        role:   "ADMIN",
        status: "ACTIVE",
        fullName,
        ...(company && { company }),
      },
      select: { id: true, email: true, role: true, status: true },
    });
    console.log("\n[ok] Existing user upgraded to ADMIN:");
    console.log(updated);
  } else {
    const user = await prisma.user.create({
      data: {
        email,
        fullName,
        company: company || null,
        passwordHash: await bcrypt.hash(password, 12),
        role:   "ADMIN",
        status: "ACTIVE",
      },
      select: { id: true, email: true, role: true, status: true },
    });
    console.log("\n[ok] Admin user created:");
    console.log(user);
  }

  console.log("\nYou can now log in at http://localhost:5174\n");
}

main()
  .catch((err) => { console.error("\n[error]", err.message); process.exit(1); })
  .finally(() => { rl.close(); prisma.$disconnect(); });
