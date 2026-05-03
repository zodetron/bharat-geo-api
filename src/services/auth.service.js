const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");

const BCRYPT_ROUNDS = 12;

function signToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

function safeUser(user) {
  const { passwordHash, ...rest } = user;
  return rest;
}

async function register(body) {
  const { email, password, fullName, company } = body;

  if (!email || !password || !fullName) {
    throw Object.assign(new Error("email, password and fullName are required"), { status: 400 });
  }
  if (password.length < 8) {
    throw Object.assign(new Error("Password must be at least 8 characters"), { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    throw Object.assign(new Error("Email already registered"), { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      fullName,
      company: company || null,
      role: "CLIENT",
      status: "PENDING",
    },
  });

  return {
    message: "Registration successful. Your account is pending admin approval.",
    user: safeUser(user),
  };
}

async function login(body) {
  const { email, password } = body;

  if (!email || !password) {
    throw Object.assign(new Error("email and password are required"), { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    throw Object.assign(new Error("Invalid credentials"), { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw Object.assign(new Error("Invalid credentials"), { status: 401 });
  }

  if (user.status === "PENDING") {
    throw Object.assign(new Error("Account pending approval. Please wait for admin activation."), { status: 403 });
  }
  if (user.status === "SUSPENDED") {
    throw Object.assign(new Error("Account suspended. Contact support."), { status: 403 });
  }

  const token = signToken(user);
  return { token, user: safeUser(user) };
}

async function getMe(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      company: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!user) throw Object.assign(new Error("User not found"), { status: 404 });
  return { user };
}

module.exports = { register, login, getMe };
