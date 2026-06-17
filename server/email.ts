import nodemailer from 'nodemailer';

export async function sendVerificationEmail(toEmail: string, verificationCode: string) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    const errorMsg = `
=========================================
⚠️ ENVIRONMENT VARIABLES NOT FULLY SET ⚠️
To send real verification emails, please configure the following in your ".env" or Secrets panel:
- GMAIL_USER
- GMAIL_APP_PASSWORD (use a Google App Password, not your regular password)

[SANDBOX SIMULATION LOG]
Target Email: ${toEmail}
Verification Code: ${verificationCode}
=========================================
    `;
    console.warn(errorMsg);
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: user,
        pass: pass,
      },
      tls: {
        rejectUnauthorized: false // avoids SSL certificate issues in containerized networks
      },
      timeout: 10000 // 10s connection timeout
    } as any);

    const mailOptions = {
      from: `"Charcha Community" <${user}>`,
      to: toEmail,
      subject: 'Charcha - Verify your email address',
      text: `Your Charcha verification code is: ${verificationCode}\n\nThis 6-digit code is required to verify and activate your Charcha blogging community profile.\n\nThank you,\nThe Charcha Team`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e5e5e5; border-radius: 12px; background-color: #fcfcfc;">
          <h2 style="color: #9D6DD6; text-align: center; font-family: Georgia, serif;">Charcha Community</h2>
          <p style="font-size: 14px; color: #333333; line-height: 1.5; margin-bottom: 20px;">Thanks for signing up for <strong>Charcha</strong>! To complete your registration and activate your account, please enter the 6-digit verification code below on the verification page:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-family: monospace; font-size: 32px; font-weight: bold; color: #9D6DD6; letter-spacing: 6px; background-color: #f0edf7; padding: 10px 20px; border-radius: 8px; border: 1px dashed #9D6DD6;">${verificationCode}</span>
          </div>
          <p style="font-size: 12px; color: #888888; text-align: center;">If you didn't request this email, please ignore it.</p>
          <hr style="border: 0; border-top: 1px solid #e5e5e5; margin: 20px 0;" />
          <p style="font-size: 11px; color: #999999; text-align: center; font-style: italic;">Charcha - A modern community blogging platform</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✉️ Real verification email successfully sent to ${toEmail}`);
  } catch (error) {
    console.error('❌ Failed to send SMTP email via Google/Nodemailer:', error);
    throw new Error('SMTP email delivery failed. Please check your GMAIL_USER and GMAIL_APP_PASSWORD values.');
  }
}

export async function sendPasswordResetEmail(toEmail: string, resetCode: string) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    const errorMsg = `
=========================================
⚠️ ENVIRONMENT VARIABLES NOT FULLY SET ⚠️
To send real password reset emails, please configure the following in your ".env" or Secrets panel:
- GMAIL_USER
- GMAIL_APP_PASSWORD

[SANDBOX SIMULATION LOG]
Target Email: ${toEmail}
Password Reset Code: ${resetCode}
=========================================
    `;
    console.warn(errorMsg);
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: user,
        pass: pass,
      },
      tls: {
        rejectUnauthorized: false // avoids SSL certificate issues in containerized networks
      },
      timeout: 10000 // 10s connection timeout
    } as any);

    const mailOptions = {
      from: `"Charcha Community" <${user}>`,
      to: toEmail,
      subject: 'Charcha - Password reset request',
      text: `Your password reset code is: ${resetCode}\n\nThis 6-digit code is required to verify your password reset request.\n\nThank you,\nThe Charcha Team`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e5e5e5; border-radius: 12px; background-color: #fcfcfc;">
          <h2 style="color: #9D6DD6; text-align: center; font-family: Georgia, serif;">Charcha Community</h2>
          <p style="font-size: 14px; color: #333333; line-height: 1.5; margin-bottom: 20px;">We received a request to reset the password for your <strong>Charcha</strong> account. Enter the 6-digit verification code below on the password reset page:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-family: monospace; font-size: 32px; font-weight: bold; color: #9D6DD6; letter-spacing: 6px; background-color: #f0edf7; padding: 10px 20px; border-radius: 8px; border: 1px dashed #9D6DD6;">${resetCode}</span>
          </div>
          <p style="font-size: 12px; color: #888888; text-align: center;">If you didn't request a password reset, please secure your account immediately.</p>
          <hr style="border: 0; border-top: 1px solid #e5e5e5; margin: 20px 0;" />
          <p style="font-size: 11px; color: #999999; text-align: center; font-style: italic;">Charcha - A modern community blogging platform</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✉️ Real password reset email successfully sent to ${toEmail}`);
  } catch (error) {
    console.error('❌ Failed to send password reset SMTP email:', error);
    throw new Error('SMTP email delivery failed.');
  }
}
