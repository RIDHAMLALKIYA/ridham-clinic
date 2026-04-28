import QRCode from 'qrcode';

export async function generateAppointmentQRCode(appointmentId: number, patientEmail: string): Promise<string> {
  const data = JSON.stringify({
    appointmentId,
    patientEmail,
    type: 'check-in'
  });
  
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(data);
    return qrCodeDataUrl;
  } catch (err) {
    console.error('Error generating QR code:', err);
    throw err;
  }
}
