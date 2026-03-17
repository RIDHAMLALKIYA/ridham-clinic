import { db } from '@/db';
import { appointments, patients } from '@/db/schema';
import { eq, and, desc, asc, not } from 'drizzle-orm';
import { sendEmail } from './mail';

/**
 * Automatically calculates queue positions for arrived patients
 * and sends notifications if they hit the Top 10 or Top 20 thresholds.
 */
export async function processQueueNotifications() {
  console.log('[QueueNotifier] 🔍 Queue notifications are currently disabled until DB sync.');
  return;
}
