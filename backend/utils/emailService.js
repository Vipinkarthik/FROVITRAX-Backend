import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

let resend = null;
const apiKey = process.env.RESEND_API_KEY;

if (apiKey && apiKey.startsWith('re_')) {
  try {
    resend = new Resend(apiKey);
  } catch (error) {
    console.warn('⚠️ Resend initialization failed:', error.message);
    resend = null;
  }
} else {
  console.warn('⚠️ Resend API key not found or invalid. Email functionality will be disabled.');
}

export const sendWelcomeEmail = async (to, name, role) => {
  if (!resend) {
    console.log(`📧 Welcome email would be sent to ${to} (${name}) - Role: ${role}`);
    console.log('⚠️ Email service disabled - Resend API key not configured');
    return;
  }

  let roleMessage = '';

  if (role === 'vendor') {
    roleMessage = `<p>As a vendor, you’ll gain tools to manage your supply chain efficiently and connect with buyers easily.</p>`;
  } else if (role === 'procurement') {
    roleMessage = `<p>As a procurement manager, you’ll streamline purchasing and supplier collaboration like never before.</p>`;
  } else {
    roleMessage = `<p>We're excited to have you onboard!</p>`;
  }

  try {
    await resend.emails.send({
      from: 'FoodChainX <onboarding@resend.dev>',
      to,
      subject: 'Welcome to FoodChainX 🎉',
      html: `
        <h2>Hello, ${name}!</h2>
        <p>Welcome to <strong>FoodChainX</strong>, where the food industry meets technology.</p>
        ${roleMessage}
        <p>Let’s make the food chain smarter together!</p>
        <hr/>
      `
    });
    console.log(`✅ Welcome email sent to ${to}`);
  } catch (error) {
    console.error('❌ Resend API error:', error?.response?.data || error.message || error);
    console.log('⚠️ Email sending failed, but user registration/login will continue');
  }
};

export const resendWelcomeEmail = async (to, name, role) => {
  return await sendWelcomeEmail(to, name, role);
};
