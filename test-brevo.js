const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: 'oluwamatic125@gmail.com',   // your Brevo email
    pass: 'xsmtpsib-39413c209b20a3007374dfcd3e470eba58c5b7f089730ed56c55d900af5ea54c-njBTlHK2kB7wCUUC',
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Authentication failed:', error);
  } else {
    console.log('✅ Brevo SMTP is ready!');
  }
});