import { createTransport } from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const testSMTP = async () => {
  console.log('Testing SMTP connection...');
  console.log('Host:', process.env.SMTP_HOST);
  console.log('Port:', process.env.SMTP_PORT);
  console.log('User:', process.env.SMTP_USER);
  console.log('Pass length:', process.env.SMTP_PASS?.length, 'chars');
  
  const transporter = createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: false, // false for port 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    debug: true, // Enable debug logs
  });

  try {
    await transporter.verify();
    console.log('\n✅ SMTP connection successful!');
  } catch (error) {
    console.error('\n❌ SMTP connection failed:', error.message);
    console.error('Full error:', error);
  }
};

testSMTP();
