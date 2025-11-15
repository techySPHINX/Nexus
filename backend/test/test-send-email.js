// backend/test-send-email.js
// Load .env for local testing
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const nodemailer = require('nodemailer');

async function main() {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    } : undefined
  });

  const info = await transporter.sendMail({
    from: "its.sonaljaiswal@gmail.com",
    to: '22051251@kiit.ac.in',
    subject: 'Nexus Backend SMTP test',
    text: 'If you see this, SMTP works.',
    html: '<b>If you see this, SMTP works.</b>'
  });

  console.log('Sent:', info.messageId);
  if (nodemailer.getTestMessageUrl) {
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
  }
}

main().catch(err => { console.error(err); process.exit(1); });