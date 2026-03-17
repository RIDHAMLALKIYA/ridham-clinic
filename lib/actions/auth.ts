'use server';

import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { login, logout } from '@/lib/auth';
import bcrypt from 'bcrypt';

// --- Brute Force Protection ---
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();
const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(email: string): { blocked: boolean; minutesLeft?: number } {
  const record = loginAttempts.get(email);
  if (!record) return { blocked: false };

  if (record.lockedUntil > Date.now()) {
    const minutesLeft = Math.ceil((record.lockedUntil - Date.now()) / 60000);
    return { blocked: true, minutesLeft };
  }

  // Lock expired, reset
  if (record.lockedUntil > 0 && record.lockedUntil <= Date.now()) {
    loginAttempts.delete(email);
  }
  return { blocked: false };
}

function recordFailedAttempt(email: string) {
  const record = loginAttempts.get(email) || { count: 0, lockedUntil: 0 };
  record.count += 1;
  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = Date.now() + LOCK_DURATION_MS;
    console.warn(`[Security] 🔒 Account locked for 15 min: ${email} (${record.count} failed attempts)`);
  }
  loginAttempts.set(email, record);
}

function clearAttempts(email: string) {
  loginAttempts.delete(email);
}

export async function authenticate(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  // Check if account is locked
  const rateCheck = checkRateLimit(email);
  if (rateCheck.blocked) {
    return { error: `Too many failed attempts. Account locked for ${rateCheck.minutesLeft} minute(s). Please try again later.` };
  }

  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user || !(await bcrypt.compare(password, user.password))) {
    recordFailedAttempt(email);
    return { error: 'Invalid email or password' };
  }

  // Successful login — clear any failed attempt records
  clearAttempts(email);
  await login({ email: user.email, id: user.id, role: user.role });

  if (user.role === 'doctor') redirect('/doctor/dashboard');
  redirect('/admin');
}

export async function logoutUser() {
  await logout();
  redirect('/login');
}

export async function seedAccounts() {
  const [doc] = await db.select().from(users).where(eq(users.email, 'doctor@clinic.com'));
  const [adm] = await db.select().from(users).where(eq(users.email, 'admin@clinic.com'));

  if (!doc) {
    const doctorPassword = await bcrypt.hash('doctor123', 10);
    await db.insert(users).values({
      email: 'doctor@clinic.com',
      password: doctorPassword,
      role: 'doctor',
    });
  }

  if (!adm) {
    const adminPassword = await bcrypt.hash('admin123', 10);
    await db.insert(users).values({
      email: 'admin@clinic.com',
      password: adminPassword,
      role: 'admin',
    });
  }

  return {
    success: true,
    message: `System accounts checked/created:\nDoctor: doctor@clinic.com / doctor123\nAdmin: admin@clinic.com / admin123`,
  };
}
