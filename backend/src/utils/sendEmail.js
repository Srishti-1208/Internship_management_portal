// Sends transactional email. If SMTP env vars are configured, sends a real
// email via nodemailer. Otherwise, falls back to logging the message to the
// server console so password reset (and any future email flow) can still be
// developed and tested end-to-end without real mail credentials.
//
// To enable real email delivery, install nodemailer (`npm install nodemailer`)
// and set these env vars: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM.
async function sendEmail({ to, subject, text, html }) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.log('\n[sendEmail] SMTP not configured — logging email instead of sending:');
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Body: ${text}\n`);
    return { delivered: false, reason: 'smtp_not_configured' };
  }

  try {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    await transporter.sendMail({
      from: SMTP_FROM || SMTP_USER,
      to,
      subject,
      text,
      html,
    });
    return { delivered: true };
  } catch (err) {
    console.error('[sendEmail] Failed to send email:', err.message);
    console.log(`[sendEmail] Fallback log — To: ${to} | Subject: ${subject} | Body: ${text}`);
    return { delivered: false, reason: 'send_failed' };
  }
}

module.exports = sendEmail;