/**
 * WhatsApp Messaging Service (Msg91 Integration)
 * This service handles sending automated WhatsApp/SMS notifications to patients.
 * It includes a 'MOCK' mode for development/testing to simulate sending messages.
 */

interface SendWhatsAppParams {
  to: string; // Phone number in international format (e.g., 919999999999)
  templateName: string;
  language: 'en' | 'gu';
  variables?: Record<string, string>;
}

export async function sendWhatsApp({
  to,
  templateName,
  language,
  variables = {},
}: SendWhatsAppParams) {
  const MOCK_MODE = process.env.WHATSAPP_MOCK_MODE === 'true' || !process.env.MSG91_AUTH_KEY;

  if (MOCK_MODE) {
    console.log('--- 📱 WHATSAPP MOCK LOG ---');
    console.log(`TO: ${to}`);
    console.log(`TEMPLATE: ${templateName}`);
    console.log(`LANG: ${language}`);
    console.log(`VARIABLES:`, variables);
    console.log('---------------------------');
    return { success: true, messageId: 'mock_' + Date.now() };
  }

  try {
    // Msg91 API endpoint for WhatsApp
    const url = 'https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/';
    
    // We would normally payload this according to Msg91 docs:
    // This is a simplified structure; actual payload depends on their latest API v5
    const payload = {
      integrated_number: process.env.WHATSAPP_PHONE_NUMBER,
      content_type: 'template',
      payload: {
        to: to.startsWith('91') ? to : `91${to}`,
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: language,
            policy: 'deterministic'
          },
          components: [
            {
              type: 'body',
              parameters: Object.entries(variables).map(([_, value]) => ({
                type: 'text',
                text: value
              }))
            }
          ]
        }
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authkey': process.env.MSG91_AUTH_KEY || '',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('WhatsApp API Error:', data);
      return { success: false, error: data };
    }

    return { success: true, response: data };
  } catch (error) {
    console.error('Failed to send WhatsApp message:', error);
    return { success: false, error };
  }
}
