import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/services/mail';
import { Receiver } from '@upstash/qstash';

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY || '',
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY || '',
});

export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text();
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Verify signature in production
    if (isProduction) {
      const signature = req.headers.get('upstash-signature');
      if (!signature) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
      }

      const isValid = await receiver.verify({
        signature,
        body: bodyText,
      }).catch(() => false);

      if (!isValid) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    // Parse the body
    const { patientName, email, messageType, preferredLanguage } = JSON.parse(bodyText);

    if (!email) return NextResponse.json({ success: false, error: 'Email missing' });

    let subject = 'Appointment Reminder - HealthCore Clinic';
    let message = '';
    const isGu = preferredLanguage === 'gu';

    if (messageType === '30min') {
      subject = isGu ? 'એપોઈન્ટમેન્ટ રીમાઇન્ડર - હેલ્થકોર ક્લિનિક' : 'Appointment Reminder - HealthCore Clinic';
      message = isGu 
        ? `નમસ્તે ${patientName},\n\nહેલ્થકોર ક્લિનિકમાં તમારી એપોઈન્ટમેન્ટ હવે ૩૦ મિનિટમાં છે. અમે તમને જોવા આતુર છીએ!\n\nશ્રેષ્ઠ શુભેચ્છાઓ,\nહેલ્થકોર ટીમ`
        : `Hello ${patientName},\n\nThis is a reminder that your appointment at HealthCore Clinic is in 30 minutes. We look forward to seeing you!\n\nBest regards,\nHealthCore Team`;
    } else {
      subject = isGu ? 'તમારી એપોઈન્ટમેન્ટ અત્યારે જ શરૂ થઈ રહી છે - હેલ્થકોર ક્લિનિક' : 'Your Appointment is Starting Now - HealthCore Clinic';
      message = isGu
        ? `નમસ્તે ${patientName},\n\nહેલ્થકોર ક્લિનિકમાં તમારી એપોઈન્ટમેન્ટ અત્યારે જ શરૂ થઈ રહી છે. જો તમે હજી ન આવ્યા હોવ તો કૃપા કરીને વેટિંગ એરિયામાં પધારો.\n\nશ્રેષ્ઠ શુભેચ્છાઓ,\nહેલ્થકોર ટીમ`
        : `Hello ${patientName},\n\nYour appointment at HealthCore Clinic is starting now. Please proceed to the waiting area if you haven't already.\n\nBest regards,\nHealthCore Team`;
    }

    await sendEmail(email, subject, message);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reminder API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
