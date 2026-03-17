import { pgTable, serial, text, boolean, timestamp, varchar, integer } from 'drizzle-orm/pg-core';

export const patients = pgTable('patients', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  phoneNumber: varchar('phone_number', { length: 20 }).notNull(),
  email: varchar('email', { length: 255 }),
  reasonForVisit: text('reason_for_visit'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const appointments = pgTable('appointments', {
  id: serial('id').primaryKey(),
  patientId: integer('patient_id').references(() => patients.id).notNull(),
  appointmentDate: varchar('appointment_date', { length: 20 }), 
  appointmentTime: varchar('appointment_time', { length: 10 }),
  scheduledAt: timestamp('scheduled_at'),
  status: varchar('status', { length: 20 }).notNull().default('requested'), // requested, scheduled, arrived, called, completed
  emergencyFlag: boolean('emergency_flag').default(false),
      notifiedTop10: boolean('notified_top_10').default(false),
      notifiedTop20: boolean('notified_top_20').default(false),
  attendedAt: timestamp('attended_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const settings = pgTable('settings', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 50 }).notNull(),
  value: text('value').notNull(),
});

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password').notNull(),
  role: varchar('role', { length: 20 }).notNull().default('doctor'), // doctor, admin
  createdAt: timestamp('created_at').defaultNow(),
});
