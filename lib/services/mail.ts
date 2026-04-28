import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendEmail(
  to: string,
  subject: string,
  text: string,
  html?: string,
  attachments?: any[]
) {
  if (process.env.DISABLE_EMAILS === 'true') {
    console.log('🔇 [EMAILS DISABLED] Would have sent to:', to, '| Subject:', subject);
    return;
  }

  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
    console.warn('SMTP credentials missing. Email not sent:', text);
    return;
  }

  // Warning for placeholder
  if (process.env.SMTP_EMAIL === 'your-email@gmail.com') {
    console.error(
      '❌ ERROR: You are still using "your-email@gmail.com" in .env. Please update it to your actual Gmail address.'
    );
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: `"HealthCore Clinic" <${process.env.SMTP_EMAIL}>`,
      to,
      subject,
      text,
      html,
      attachments,
    });
    console.log('✅ Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
}
