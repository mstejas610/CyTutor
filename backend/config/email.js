const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendOTP = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'CyTutor - Email Verification OTP',
    html: `
      <h2>Email Verification</h2>
      <p>Your OTP code is: <strong>${otp}</strong></p>
      <p>This code will expire in ${process.env.OTP_EXPIRE_MINUTES} minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendOTP };
