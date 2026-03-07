import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/services/mail";

export async function POST(req: NextRequest) {
  try {
    const { patientName, email, messageType } = await req.json();

    if (!email) return NextResponse.json({ success: false, error: "Email missing" });

    let subject = "Appointment Reminder - HealthCore Clinic";
    let message = "";
    
    if (messageType === '30min') {
      message = `Hello ${patientName},\n\nThis is a reminder that your appointment at HealthCore Clinic is in 30 minutes. We look forward to seeing you!\n\nBest regards,\nHealthCore Team`;
    } else {
      subject = "Your Appointment is Starting Now - HealthCore Clinic";
      message = `Hello ${patientName},\n\nYour appointment at HealthCore Clinic is starting now. Please proceed to the waiting area if you haven't already.\n\nBest regards,\nHealthCore Team`;
    }

    await sendEmail(email, subject, message);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reminder API Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
