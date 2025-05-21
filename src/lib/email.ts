import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 *  Send a plain-HTML e-mail
 */
export async function sendWelcomeEmail(to: string) {
  return resend.emails.send({
    from: process.env.EMAIL_FROM!,      // e.g. no-reply@bulletbuilder.net
    to,
    subject: 'Welcome to Bullet Builder',
    html: '<h1>Thanks for trying Bullet Builder!</h1><p>Enjoy 🎉</p>',
  });
}
