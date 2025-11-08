require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const sgMail = require('@sendgrid/mail');

async function main() {
  if (!process.env.SENDGRID_API_KEY) {
    console.error('SENDGRID_API_KEY not set in environment or .env');
    process.exit(1);
  }

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const msg = {
    to: '22051251@kiit.ac.in',
    from: { email: process.env.SENDGRID_EMAIL_FROM || 'noreply@yourdomain.com' },
    subject: 'SendGrid test from Nexus',
    text: 'This is a test message from Nexus backend using SendGrid',
    html: '<b>This is a test message from Nexus backend using SendGrid</b>',
  };

  try {
    const res = await sgMail.send(msg);
    console.log('SendGrid send result:', res && res[0] && res[0].statusCode);
    if (res && res[0] && res[0].headers) console.log('Headers:', res[0].headers);
  } catch (err) {
    if (err && err.response && err.response.body) {
      console.error('SendGrid error body:', JSON.stringify(err.response.body, null, 2));
    } else {
      console.error('SendGrid error:', err.message || err);
    }
    process.exit(1);
  }
}

main();
