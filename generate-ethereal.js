const nodemailer = require('nodemailer');

async function createTestAccount() {
  // Generate test SMTP service account
  const testAccount = await nodemailer.createTestAccount();
  
  console.log('Ethereal Email credentials:');
  console.log('Email:', testAccount.user);
  console.log('Password:', testAccount.pass);
  console.log('SMTP Host:', testAccount.smtp.host);
  console.log('SMTP Port:', testAccount.smtp.port);
}

createTestAccount();