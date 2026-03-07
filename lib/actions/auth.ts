'use server';

import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { login, logout } from '@/lib/auth';
import bcrypt from 'bcrypt';

export async function authenticate(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return { error: 'Invalid email or password' };
  }

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
